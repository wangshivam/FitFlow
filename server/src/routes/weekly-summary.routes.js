/**
 * Weekly Summary Routes + Controller
 * Aggregates food, workout, weight, and consistency data per week
 * Generates AI insights for premium users via Groq
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Groq from 'groq-sdk';
import { authenticate } from '../middleware/auth.middleware.js';
import db from '../db/connection.js';

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.use(authenticate);

// ── Helpers ──

/**
 * Get Monday and Sunday dates for a given week offset (0 = this week).
 * Week starts on Monday.
 */
function getWeekRange(offset = 0) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Get Monday of the current week
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday - (offset * 7));

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    start: formatDate(monday),
    end: formatDate(sunday),
    mondayDate: monday,
    sundayDate: sunday,
  };
}

function formatDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDayName(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
}

/**
 * Build an array of 7 date strings (Mon→Sun) for a given week.
 */
function getWeekDates(weekStart) {
  const start = new Date(weekStart + 'T00:00:00');
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(formatDate(d));
  }
  return dates;
}


// ── GET /api/weekly-summary/:weekOffset ──
router.get('/:weekOffset', async (req, res, next) => {
  try {
    const offset = parseInt(req.params.weekOffset) || 0;

    // Validate offset range
    if (offset < 0 || offset > 51) {
      return res.status(400).json({ error: 'Week offset must be between 0 and 51.' });
    }

    // Premium gating: free users get 4 weeks (0–3)
    const isPremium = req.user.tier === 'premium';
    if (!isPremium && offset > 3) {
      return res.status(403).json({
        error: 'Free users can access only the last 4 weeks. Upgrade to Premium for 52-week history.',
        code: 'PREMIUM_REQUIRED',
        upgrade_url: '/premium',
      });
    }

    const { start: weekStart, end: weekEnd } = getWeekRange(offset);
    const weekDates = getWeekDates(weekStart);
    const userId = req.user.id;

    // ── Check cache ──
    const cached = await db('weekly_summaries')
      .where({ user_id: userId, week_start: weekStart })
      .first();

    const isCurrentWeek = offset === 0;
    const cacheMaxAge = isCurrentWeek ? 60 * 60 * 1000 : Infinity; // 1 hour for current week

    if (cached && cached.computed_at) {
      const cacheAge = Date.now() - new Date(cached.computed_at).getTime();
      if (cacheAge < cacheMaxAge) {
        return res.json({
          ...formatCachedResponse(cached, isPremium),
          from_cache: true,
        });
      }
    }

    // ── Aggregate from raw tables ──

    // 1. Food logs per day
    const foodLogs = await db('food_logs')
      .where({ user_id: userId })
      .whereBetween('log_date', [weekStart, weekEnd])
      .select(
        'log_date',
        db.raw('SUM(total_calories) as calories'),
        db.raw('SUM(total_protein) as protein'),
        db.raw('SUM(total_carbs) as carbs'),
        db.raw('SUM(total_fat) as fat'),
        db.raw('COUNT(*) as meal_count'),
      )
      .groupBy('log_date')
      .orderBy('log_date', 'asc');

    // 2. Workout plans per day
    const workouts = await db('workout_plans')
      .where({ user_id: userId })
      .whereBetween('plan_date', [weekStart, weekEnd])
      .select('plan_date', 'status', 'estimated_calories_burn', 'is_rest_day');

    // 3. Weight logs per day
    const weights = await db('weight_logs')
      .where({ user_id: userId })
      .whereBetween('log_date', [weekStart, weekEnd])
      .select('log_date', 'weight_kg', 'logged_at')
      .orderBy('log_date', 'asc');

    // 4. Daily summaries (for water)
    const dailySummaries = await db('daily_summaries')
      .where({ user_id: userId })
      .whereBetween('summary_date', [weekStart, weekEnd])
      .select('summary_date', 'water_ml', 'adherence_score');

    // 5. User profile for targets
    const profile = await db('user_profiles')
      .where({ user_id: userId })
      .first();

    const calorieTarget = profile?.daily_calorie_target || 2000;
    const proteinTarget = profile?.daily_protein_target || 125;
    const carbTarget = profile?.daily_carb_target || 250;
    const fatTarget = profile?.daily_fat_target || 56;

    // ── Build daily breakdown ──
    const foodByDate = Object.fromEntries(foodLogs.map(f => [f.log_date, f]));
    const workoutByDate = Object.fromEntries(workouts.map(w => [w.plan_date, w]));
    const weightByDate = Object.fromEntries(weights.map(w => [w.log_date, w]));
    const summaryByDate = Object.fromEntries(dailySummaries.map(s => [s.summary_date, s]));

    const dailyBreakdown = weekDates.map(date => {
      const food = foodByDate[date];
      const workout = workoutByDate[date];
      const weight = weightByDate[date];
      const summary = summaryByDate[date];

      const foodCalories = parseFloat(food?.calories) || 0;
      const exerciseCalories = (!workout?.is_rest_day && workout?.status === 'completed')
        ? (workout?.estimated_calories_burn || 0)
        : 0;
      const remaining = Math.max(0, calorieTarget - foodCalories + exerciseCalories);

      return {
        date,
        day: getDayName(date),
        food_calories: Math.round(foodCalories),
        exercise_calories: Math.round(exerciseCalories),
        remaining_calories: Math.round(remaining),
        protein: parseFloat(food?.protein) || 0,
        carbs: parseFloat(food?.carbs) || 0,
        fat: parseFloat(food?.fat) || 0,
        meals_logged: parseInt(food?.meal_count) || 0,
        workout_status: workout?.status || null,
        workout_is_rest: workout?.is_rest_day || false,
        weight_kg: weight?.weight_kg || null,
        weight_time: weight?.logged_at || null,
        water_ml: summary?.water_ml || 0,
        has_data: !!food || !!workout || !!weight,
      };
    });

    // ── Compute totals ──
    const daysTracked = dailyBreakdown.filter(d => d.meals_logged > 0).length;
    const totalCalories = dailyBreakdown.reduce((s, d) => s + d.food_calories, 0);
    const avgCalories = daysTracked > 0 ? totalCalories / daysTracked : 0;
    const totalProtein = dailyBreakdown.reduce((s, d) => s + d.protein, 0);
    const totalCarbs = dailyBreakdown.reduce((s, d) => s + d.carbs, 0);
    const totalFat = dailyBreakdown.reduce((s, d) => s + d.fat, 0);
    const totalMeals = dailyBreakdown.reduce((s, d) => s + d.meals_logged, 0);
    const workoutsCompleted = dailyBreakdown.filter(d => d.workout_status === 'completed').length;
    const waterTotal = dailyBreakdown.reduce((s, d) => s + d.water_ml, 0);

    // Weight change
    const weightEntries = dailyBreakdown.filter(d => d.weight_kg !== null);
    const startWeight = weightEntries.length > 0 ? weightEntries[0].weight_kg : null;
    const endWeight = weightEntries.length > 0 ? weightEntries[weightEntries.length - 1].weight_kg : null;

    // Streak count: consecutive days with food logs
    let streakCount = 0;
    for (let i = dailyBreakdown.length - 1; i >= 0; i--) {
      const d = dailyBreakdown[i];
      // Only count up to today
      if (new Date(d.date + 'T00:00:00') > new Date()) continue;
      if (d.meals_logged > 0) {
        streakCount++;
      } else {
        break;
      }
    }

    // ── Previous week comparison ──
    let prevWeekCalories = null;
    if (offset < 51) {
      const { start: prevStart, end: prevEnd } = getWeekRange(offset + 1);
      const prevFood = await db('food_logs')
        .where({ user_id: userId })
        .whereBetween('log_date', [prevStart, prevEnd])
        .select(db.raw('SUM(total_calories) as total_cal'))
        .first();
      prevWeekCalories = parseFloat(prevFood?.total_cal) || 0;
    }

    // ── Calorie goal achievement ──
    const daysWithinGoal = dailyBreakdown.filter(d => {
      if (d.meals_logged === 0) return false;
      const net = d.food_calories - d.exercise_calories;
      return net <= calorieTarget * 1.05; // 5% tolerance
    }).length;
    const goalAchievementPct = daysTracked > 0 ? Math.round((daysWithinGoal / daysTracked) * 100) : 0;

    // ── Macro adherence ──
    const macroAdherence = daysTracked > 0 ? Math.round((
      (Math.min(1, totalProtein / (proteinTarget * daysTracked)) +
       Math.min(1, totalCarbs / (carbTarget * daysTracked)) +
       Math.min(1, totalFat / (fatTarget * daysTracked))) / 3
    ) * 100) : 0;

    // ── Consistency metrics ──
    const workoutDays = dailyBreakdown.filter(d => d.workout_status !== null && !d.workout_is_rest);
    const workoutCompletionPct = workoutDays.length > 0
      ? Math.round((workoutsCompleted / workoutDays.length) * 100)
      : 0;

    const waterDays = dailyBreakdown.filter(d => d.water_ml > 0).length;

    // ── AI Insights (premium only) ──
    let aiInsights = [];
    let aiCoachSummary = null;

    if (isPremium && daysTracked > 0) {
      try {
        const aiResult = await generateAIInsights({
          dailyBreakdown,
          totalCalories,
          avgCalories,
          totalProtein,
          totalCarbs,
          totalFat,
          daysTracked,
          workoutsCompleted,
          startWeight,
          endWeight,
          goalAchievementPct,
          calorieTarget,
          proteinTarget,
          prevWeekCalories,
          profile,
        });
        aiInsights = aiResult.insights || [];
        aiCoachSummary = aiResult.coachSummary || null;
      } catch (err) {
        console.error('AI insights generation error:', err);
        // Gracefully degrade — return without AI
      }
    }

    // ── Stats-based insights for free users ──
    if (!isPremium && daysTracked > 0) {
      aiInsights = generateBasicInsights({
        dailyBreakdown,
        totalCalories,
        avgCalories,
        totalProtein,
        daysTracked,
        workoutsCompleted,
        startWeight,
        endWeight,
        calorieTarget,
        prevWeekCalories,
      });
    }

    // ── Build response ──
    const summaryData = {
      week_start: weekStart,
      week_end: weekEnd,
      week_offset: offset,
      total_calories: Math.round(totalCalories),
      avg_calories: Math.round(avgCalories),
      total_protein: parseFloat(totalProtein.toFixed(1)),
      total_carbs: parseFloat(totalCarbs.toFixed(1)),
      total_fat: parseFloat(totalFat.toFixed(1)),
      days_tracked: daysTracked,
      meals_logged: totalMeals,
      workouts_completed: workoutsCompleted,
      water_total_ml: waterTotal,
      start_weight: startWeight,
      end_weight: endWeight,
      weight_change: startWeight && endWeight ? parseFloat((endWeight - startWeight).toFixed(1)) : null,
      streak_count: streakCount,
      goal_achievement_pct: goalAchievementPct,
      macro_adherence_pct: macroAdherence,
      workout_completion_pct: workoutCompletionPct,
      water_days: waterDays,
      prev_week_calories: prevWeekCalories,
      calorie_diff_vs_prev: prevWeekCalories ? Math.round(totalCalories - prevWeekCalories) : null,
      daily_breakdown: dailyBreakdown,
      ai_insights: aiInsights,
      ai_coach_summary: aiCoachSummary,
      is_premium: isPremium,
      targets: {
        calories: calorieTarget,
        protein: proteinTarget,
        carbs: carbTarget,
        fat: fatTarget,
      },
    };

    // ── Upsert cache ──
    try {
      if (cached) {
        await db('weekly_summaries').where({ id: cached.id }).update({
          total_calories: summaryData.total_calories,
          avg_calories: summaryData.avg_calories,
          total_protein: summaryData.total_protein,
          total_carbs: summaryData.total_carbs,
          total_fat: summaryData.total_fat,
          days_tracked: summaryData.days_tracked,
          meals_logged: summaryData.meals_logged,
          workouts_completed: summaryData.workouts_completed,
          water_total_ml: summaryData.water_total_ml,
          start_weight: summaryData.start_weight,
          end_weight: summaryData.end_weight,
          streak_count: summaryData.streak_count,
          ai_insights: JSON.stringify(summaryData.ai_insights),
          ai_coach_summary: summaryData.ai_coach_summary,
          daily_breakdown: JSON.stringify(summaryData.daily_breakdown),
          computed_at: db.fn.now(),
        });
      } else {
        await db('weekly_summaries').insert({
          id: uuidv4(),
          user_id: userId,
          week_start: weekStart,
          week_end: weekEnd,
          total_calories: summaryData.total_calories,
          avg_calories: summaryData.avg_calories,
          total_protein: summaryData.total_protein,
          total_carbs: summaryData.total_carbs,
          total_fat: summaryData.total_fat,
          days_tracked: summaryData.days_tracked,
          meals_logged: summaryData.meals_logged,
          workouts_completed: summaryData.workouts_completed,
          water_total_ml: summaryData.water_total_ml,
          start_weight: summaryData.start_weight,
          end_weight: summaryData.end_weight,
          streak_count: summaryData.streak_count,
          ai_insights: JSON.stringify(summaryData.ai_insights),
          ai_coach_summary: summaryData.ai_coach_summary,
          daily_breakdown: JSON.stringify(summaryData.daily_breakdown),
          computed_at: db.fn.now(),
        });
      }
    } catch (cacheErr) {
      console.error('Weekly summary cache write error:', cacheErr);
      // Non-fatal — still return data
    }

    res.json({ ...summaryData, from_cache: false });
  } catch (err) {
    console.error('Weekly summary error:', err);
    next(err);
  }
});


// ── POST /api/weekly-summary/weight-log — Log weight ──
router.post('/weight-log', async (req, res, next) => {
  try {
    const { weight_kg, log_date } = req.body;

    if (!weight_kg || weight_kg <= 0 || weight_kg > 500) {
      return res.status(400).json({ error: 'Invalid weight. Must be between 0 and 500 kg.' });
    }

    const date = log_date || new Date().toISOString().split('T')[0];

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    }

    // Upsert
    const existing = await db('weight_logs')
      .where({ user_id: req.user.id, log_date: date })
      .first();

    if (existing) {
      await db('weight_logs').where({ id: existing.id }).update({
        weight_kg: parseFloat(weight_kg),
        logged_at: db.fn.now(),
      });
    } else {
      await db('weight_logs').insert({
        id: uuidv4(),
        user_id: req.user.id,
        log_date: date,
        weight_kg: parseFloat(weight_kg),
      });
    }

    // Also update profile's current weight
    await db('user_profiles')
      .where({ user_id: req.user.id })
      .update({ weight_kg: parseFloat(weight_kg) });

    const entry = await db('weight_logs')
      .where({ user_id: req.user.id, log_date: date })
      .first();

    res.status(201).json({ weight_log: entry });
  } catch (err) {
    console.error('Weight log error:', err);
    next(err);
  }
});


// ── GET /api/weekly-summary/weight-log — Get weight logs ──
router.get('/weight-log', async (req, res, next) => {
  try {
    const { start_date, end_date, limit } = req.query;

    let query = db('weight_logs')
      .where({ user_id: req.user.id })
      .orderBy('log_date', 'desc');

    if (start_date && end_date) {
      query = query.whereBetween('log_date', [start_date, end_date]);
    }

    if (limit) {
      query = query.limit(parseInt(limit) || 30);
    }

    const logs = await query;
    res.json({ weight_logs: logs });
  } catch (err) {
    next(err);
  }
});


// ── AI Insight Helpers ──

async function generateAIInsights(data) {
  const {
    dailyBreakdown, totalCalories, avgCalories, totalProtein,
    totalCarbs, totalFat, daysTracked, workoutsCompleted,
    startWeight, endWeight, goalAchievementPct, calorieTarget,
    proteinTarget, prevWeekCalories, profile,
  } = data;

  const weightChange = startWeight && endWeight
    ? (endWeight - startWeight).toFixed(1)
    : 'N/A';

  const mostConsistentDay = [...dailyBreakdown]
    .filter(d => d.meals_logged > 0)
    .sort((a, b) => b.meals_logged - a.meals_logged)[0]?.day || 'N/A';

  const lowestActivityDay = [...dailyBreakdown]
    .sort((a, b) => a.exercise_calories - b.exercise_calories)[0]?.day || 'N/A';

  const prompt = `You are FitFlow's AI analytics engine. Analyze this user's weekly fitness data and provide:

1. A JSON array of 5 short insight strings (each 1 sentence, max 15 words) highlighting key patterns, improvements, and areas to focus on.
2. A coaching summary paragraph (2-3 sentences, encouraging and actionable).

USER PROFILE:
- Goal: ${profile?.goal || 'general fitness'}
- Daily calorie target: ${calorieTarget} kcal
- Daily protein target: ${proteinTarget}g

WEEKLY DATA:
- Days tracked: ${daysTracked}/7
- Total calories: ${totalCalories} kcal (avg ${Math.round(avgCalories)}/day)
- Previous week total: ${prevWeekCalories || 'N/A'} kcal
- Total protein: ${Math.round(totalProtein)}g, carbs: ${Math.round(totalCarbs)}g, fat: ${Math.round(totalFat)}g
- Workouts completed: ${workoutsCompleted}
- Weight change: ${weightChange} kg
- Goal achievement: ${goalAchievementPct}%
- Most consistent day: ${mostConsistentDay}
- Lowest activity day: ${lowestActivityDay}

Respond ONLY with valid JSON in this exact format:
{"insights": ["insight 1", "insight 2", "insight 3", "insight 4", "insight 5"], "coachSummary": "coaching paragraph here"}`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 512,
    messages: [
      { role: 'system', content: 'You are a fitness analytics AI. Respond only with valid JSON. No markdown wrapping.' },
      { role: 'user', content: prompt },
    ],
  });

  const content = response.choices[0]?.message?.content || '';

  // Parse JSON from response
  try {
    // Try to extract JSON from the response (handle possible markdown wrapping)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (parseErr) {
    console.error('AI insights JSON parse error:', parseErr);
  }

  return { insights: [], coachSummary: null };
}

function generateBasicInsights(data) {
  const {
    dailyBreakdown, totalCalories, avgCalories, totalProtein,
    daysTracked, workoutsCompleted, startWeight, endWeight,
    calorieTarget, prevWeekCalories,
  } = data;

  const insights = [];

  // Calorie tracking
  if (daysTracked > 0) {
    const avgVsTarget = Math.round(avgCalories) - calorieTarget;
    if (avgVsTarget > 0) {
      insights.push(`Average ${Math.abs(avgVsTarget)} kcal over daily target`);
    } else if (avgVsTarget < -100) {
      insights.push(`Average ${Math.abs(avgVsTarget)} kcal under daily target`);
    } else {
      insights.push('Average calories very close to daily target 🎯');
    }
  }

  // vs Previous week
  if (prevWeekCalories && prevWeekCalories > 0) {
    const diff = totalCalories - prevWeekCalories;
    const pct = Math.round((diff / prevWeekCalories) * 100);
    if (diff > 0) {
      insights.push(`${Math.abs(pct)}% more calories than last week`);
    } else if (diff < 0) {
      insights.push(`${Math.abs(pct)}% fewer calories than last week`);
    }
  }

  // Weight change
  if (startWeight && endWeight) {
    const change = (endWeight - startWeight).toFixed(1);
    if (change > 0) {
      insights.push(`Weight increased by ${change} kg`);
    } else if (change < 0) {
      insights.push(`Weight decreased by ${Math.abs(change)} kg`);
    } else {
      insights.push('Weight remained stable this week');
    }
  }

  // Most consistent day
  const bestDay = [...dailyBreakdown]
    .filter(d => d.meals_logged > 0)
    .sort((a, b) => b.meals_logged - a.meals_logged)[0];
  if (bestDay) {
    insights.push(`Most consistent day: ${bestDay.day}`);
  }

  // Tracking consistency
  insights.push(`${daysTracked} of 7 days tracked this week`);

  return insights.slice(0, 5);
}


// ── Format cached response ──

function formatCachedResponse(cached, isPremium) {
  let dailyBreakdown = [];
  let aiInsights = [];

  try {
    dailyBreakdown = typeof cached.daily_breakdown === 'string'
      ? JSON.parse(cached.daily_breakdown)
      : (cached.daily_breakdown || []);
  } catch { /* ignore */ }

  try {
    aiInsights = typeof cached.ai_insights === 'string'
      ? JSON.parse(cached.ai_insights)
      : (cached.ai_insights || []);
  } catch { /* ignore */ }

  // Compute derived fields from daily_breakdown
  const daysTracked = dailyBreakdown.filter(d => d.meals_logged > 0).length;
  const calorieTarget = 2000; // Will be overridden by profile in full computation

  const daysWithinGoal = dailyBreakdown.filter(d => {
    if (d.meals_logged === 0) return false;
    const net = d.food_calories - d.exercise_calories;
    return net <= calorieTarget * 1.05;
  }).length;

  return {
    week_start: cached.week_start,
    week_end: cached.week_end,
    total_calories: cached.total_calories,
    avg_calories: cached.avg_calories,
    total_protein: cached.total_protein,
    total_carbs: cached.total_carbs,
    total_fat: cached.total_fat,
    days_tracked: cached.days_tracked,
    meals_logged: cached.meals_logged,
    workouts_completed: cached.workouts_completed,
    water_total_ml: cached.water_total_ml,
    start_weight: cached.start_weight,
    end_weight: cached.end_weight,
    weight_change: cached.start_weight && cached.end_weight
      ? parseFloat((cached.end_weight - cached.start_weight).toFixed(1))
      : null,
    streak_count: cached.streak_count,
    goal_achievement_pct: daysTracked > 0 ? Math.round((daysWithinGoal / daysTracked) * 100) : 0,
    daily_breakdown: dailyBreakdown,
    ai_insights: isPremium ? aiInsights : aiInsights.slice(0, 3),
    ai_coach_summary: isPremium ? cached.ai_coach_summary : null,
    is_premium: isPremium,
  };
}

export default router;
