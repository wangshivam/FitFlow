/**
 * Food Routes + Controller
 * Handles food parsing, logging, and retrieval
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../validators/food.validator.js';
import { foodParseSchema, foodLogSchema, foodLogUpdateSchema, quickLogSchema, searchFoodSchema, matchFoodSchema, calculateFoodSchema } from '../validators/food.validator.js';
import { parseFood } from '../services/food-parser.service.js';
import nutritionService from '../services/nutrition.service.js';
import { calculateAllTargets } from '../services/tdee.service.js';
import db from '../db/connection.js';

const router = Router();

// All food routes require authentication
router.use(authenticate);

// ── POST /api/food/parse — Parse food text into nutrition data ──
router.post('/parse', validate(foodParseSchema), async (req, res, next) => {
  try {
    const { raw_input, meal_slot } = req.validated;

    // Get user's diet type for better parsing
    const profile = await db('user_profiles')
      .where({ user_id: req.user.id })
      .first();
    const dietType = profile?.diet_type || null;

    // Check usage limits (trial-aware)
    if (req.user.tier !== 'premium') {
      const today = new Date().toISOString().split('T')[0];

      // Determine effective limit: 999 during trial, 3 after
      const isInTrial = req.user.trial_ends_at && new Date(req.user.trial_ends_at) > new Date();
      const effectiveMax = isInTrial ? 999 : 3;

      let usageRow = await db('usage_limits')
        .where({ user_id: req.user.id, limit_date: today })
        .first();

      // Upsert today's usage row if missing
      if (!usageRow) {
        await db('usage_limits').insert({
          user_id: req.user.id,
          limit_date: today,
          food_logs_max: effectiveMax,
          coach_messages_max: 3,
        });
        usageRow = { food_logs_used: 0, food_logs_max: effectiveMax };
      }

      const limit = usageRow.food_logs_max ?? effectiveMax;
      if (usageRow.food_logs_used >= limit) {
        const upgradeMsg = isInTrial
          ? "You've reached today's food log limit. Upgrade to Premium for unlimited logging."
          : "Your free trial has ended. Upgrade to FitFlow Premium to continue tracking your meals.";
        return res.status(429).json({
          error: upgradeMsg,
          code: 'LIMIT_REACHED',
          limit,
          used: usageRow.food_logs_used,
          upgrade_url: '/premium',
          is_trial: isInTrial,
          trial_ends_at: req.user.trial_ends_at,
        });
      }
    }

    const result = await parseFood(raw_input, dietType);

    res.json({
      items: result.items,
      meal_suggestion: meal_slot || result.meal_suggestion,
      raw_input,
      needs_clarification: result.needs_clarification || false,
      clarification_question: result.clarification_question || null,
      has_estimated_items: result.has_estimated_items || false,
    });
  } catch (err) {
    console.error('Food parse error:', err);
    next(err);
  }
});


// ── POST /api/food/log — Save confirmed food log ──
router.post('/log', validate(foodLogSchema), async (req, res, next) => {
  try {
    const { meal_slot, raw_input, items, log_date } = req.validated;
    const date = log_date || new Date().toISOString().split('T')[0];

    // Calculate totals
    const totals = items.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat,
        fibre: acc.fibre + (item.fibre || 0),
        sugar: acc.sugar + (item.sugar || 0),
        sodium: acc.sodium + (item.sodium || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0, sugar: 0, sodium: 0 }
    );

    const logId = uuidv4();
    const isCached = items.every((i) => i.from_cache);

    await db.transaction(async (trx) => {
      // Create food log
      await trx('food_logs').insert({
        id: logId,
        user_id: req.user.id,
        log_date: date,
        meal_slot,
        raw_input,
        total_calories: Math.round(totals.calories),
        total_protein: parseFloat(totals.protein.toFixed(1)),
        total_carbs: parseFloat(totals.carbs.toFixed(1)),
        total_fat: parseFloat(totals.fat.toFixed(1)),
        total_fibre: parseFloat(totals.fibre.toFixed(1)),
        total_sugar: parseFloat(totals.sugar.toFixed(1)),
        total_sodium: parseFloat(totals.sodium.toFixed(1)),
        is_cached: isCached,
        user_edited: false,
      });

      // Create food log items
      const logItems = items.map((item) => ({
        id: uuidv4(),
        food_log_id: logId,
        food_name: item.food_name,
        food_name_hi: item.food_name_hi || '',
        quantity: item.quantity,
        unit: item.unit,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        fibre: item.fibre || 0,
        sugar: item.sugar || 0,
        sodium: item.sodium || 0,
        confidence_score: item.confidence || 0.8,
        from_cache: item.from_cache || false,
      }));

      await trx('food_log_items').insert(logItems);

      // Update usage limits
      const today = new Date().toISOString().split('T')[0];
      const existing = await trx('usage_limits')
        .where({ user_id: req.user.id, limit_date: today })
        .first();

      if (existing) {
        await trx('usage_limits')
          .where({ id: existing.id })
          .update({ food_logs_used: existing.food_logs_used + 1 });
      } else {
        await trx('usage_limits').insert({
          id: uuidv4(),
          user_id: req.user.id,
          limit_date: today,
          food_logs_used: 1,
          coach_messages_used: 0,
          food_logs_max: req.user.tier === 'premium' ? 999 : 5,
          coach_messages_max: req.user.tier === 'premium' ? 999 : 10,
        });
      }
    });

    // Fetch the created log with items
    const foodLog = await db('food_logs').where({ id: logId }).first();
    const foodLogItems = await db('food_log_items').where({ food_log_id: logId });

    res.status(201).json({
      food_log: { ...foodLog, items: foodLogItems },
    });
  } catch (err) {
    console.error('Food log error:', err);
    next(err);
  }
});

// ── GET /api/food/logs/:date — Get food logs for a date ──
router.get('/logs/:date', async (req, res, next) => {
  try {
    const { date } = req.params;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    }

    const logs = await db('food_logs')
      .where({ user_id: req.user.id, log_date: date })
      .orderBy('created_at', 'asc');

    // Fetch items for each log
    const logIds = logs.map((l) => l.id);
    const allItems = logIds.length > 0
      ? await db('food_log_items').whereIn('food_log_id', logIds)
      : [];

    const logsWithItems = logs.map((log) => ({
      ...log,
      items: allItems.filter((item) => item.food_log_id === log.id),
    }));

    // Calculate daily totals
    const dailyTotals = logs.reduce(
      (acc, log) => ({
        calories: acc.calories + (log.total_calories || 0),
        protein: acc.protein + (log.total_protein || 0),
        carbs: acc.carbs + (log.total_carbs || 0),
        fat: acc.fat + (log.total_fat || 0),
        fibre: acc.fibre + (log.total_fibre || 0),
        sugar: acc.sugar + (log.total_sugar || 0),
        sodium: acc.sodium + (log.total_sodium || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0, sugar: 0, sodium: 0 }
    );

    res.json({
      date,
      logs: logsWithItems,
      daily_totals: dailyTotals,
      meals_count: logs.length,
    });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/food/log/:id — Update a food log ──
router.put('/log/:id', validate(foodLogUpdateSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { items } = req.validated;

    // Verify ownership
    const log = await db('food_logs')
      .where({ id, user_id: req.user.id })
      .first();
    if (!log) {
      return res.status(404).json({ error: 'Food log not found' });
    }

    await db.transaction(async (trx) => {
      // Delete old items
      await trx('food_log_items').where({ food_log_id: id }).del();

      // Insert new items
      const newItems = items.map((item) => ({
        id: item.id || uuidv4(),
        food_log_id: id,
        food_name: item.food_name,
        food_name_hi: item.food_name_hi || '',
        quantity: item.quantity,
        unit: item.unit,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        fibre: item.fibre || 0,
        sugar: item.sugar || 0,
        sodium: item.sodium || 0,
        confidence_score: 1.0,
        from_cache: false,
      }));

      await trx('food_log_items').insert(newItems);

      // Recalculate totals
      const totals = items.reduce(
        (acc, item) => ({
          calories: acc.calories + item.calories,
          protein: acc.protein + item.protein,
          carbs: acc.carbs + item.carbs,
          fat: acc.fat + item.fat,
          fibre: acc.fibre + (item.fibre || 0),
          sugar: acc.sugar + (item.sugar || 0),
          sodium: acc.sodium + (item.sodium || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0, sugar: 0, sodium: 0 }
      );

      await trx('food_logs').where({ id }).update({
        total_calories: Math.round(totals.calories),
        total_protein: parseFloat(totals.protein.toFixed(1)),
        total_carbs: parseFloat(totals.carbs.toFixed(1)),
        total_fat: parseFloat(totals.fat.toFixed(1)),
        total_fibre: parseFloat(totals.fibre.toFixed(1)),
        total_sugar: parseFloat(totals.sugar.toFixed(1)),
        total_sodium: parseFloat(totals.sodium.toFixed(1)),
        user_edited: true,
      });
    });

    // Fetch updated log
    const updatedLog = await db('food_logs').where({ id }).first();
    const updatedItems = await db('food_log_items').where({ food_log_id: id });

    res.json({
      food_log: { ...updatedLog, items: updatedItems },
    });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/food/log/:id — Delete a food log ──
router.delete('/log/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const log = await db('food_logs')
      .where({ id, user_id: req.user.id })
      .first();
    if (!log) {
      return res.status(404).json({ error: 'Food log not found' });
    }

    await db.transaction(async (trx) => {
      await trx('food_log_items').where({ food_log_id: id }).del();
      await trx('food_logs').where({ id }).del();
    });

    res.json({ success: true, deleted_id: id });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/food/summary/:date — Daily nutrition summary ──
router.get('/summary/:date', async (req, res, next) => {
  try {
    const { date } = req.params;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    }

    // Get user profile for targets
    const profile = await db('user_profiles')
      .where({ user_id: req.user.id })
      .first();

    // Get all logs for the date
    const logs = await db('food_logs')
      .where({ user_id: req.user.id, log_date: date })
      .orderBy('created_at', 'asc');

    const consumed = logs.reduce(
      (acc, log) => ({
        calories: acc.calories + (log.total_calories || 0),
        protein: acc.protein + (log.total_protein || 0),
        carbs: acc.carbs + (log.total_carbs || 0),
        fat: acc.fat + (log.total_fat || 0),
        fibre: acc.fibre + (log.total_fibre || 0),
        sugar: acc.sugar + (log.total_sugar || 0),
        sodium: acc.sodium + (log.total_sodium || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0, sugar: 0, sodium: 0 }
    );

    // Compute targets: use stored profile targets if available, else estimate from TDEE, else sensible age/gender defaults
    let targets;
    const hasStoredTargets = profile?.daily_calorie_target && profile.daily_calorie_target > 0;
    if (hasStoredTargets) {
      targets = {
        calories: profile.daily_calorie_target,
        protein: profile.daily_protein_target || Math.round(profile.daily_calorie_target * 0.25 / 4),
        carbs: profile.daily_carb_target || Math.round(profile.daily_calorie_target * 0.50 / 4),
        fat: profile.daily_fat_target || Math.round(profile.daily_calorie_target * 0.25 / 9),
      };
    } else if (profile?.weight_kg && profile?.height_cm && profile?.age && profile?.gender) {
      // Can compute TDEE — do it on the fly
      const computed = calculateAllTargets(profile);
      targets = {
        calories: computed.daily_calorie_target,
        protein: computed.daily_protein_target,
        carbs: computed.daily_carb_target,
        fat: computed.daily_fat_target,
      };
    } else {
      // No profile data — return null targets to signal incomplete onboarding
      targets = { calories: null, protein: null, carbs: null, fat: null };
    }

    const mealSlots = [
      'breakfast', 'morning_chai', 'lunch',
      'evening_snack', 'dinner', 'pre_workout', 'post_workout',
    ];

    const mealBreakdown = mealSlots.map((slot) => {
      const slotLogs = logs.filter((l) => l.meal_slot === slot);
      return {
        slot,
        count: slotLogs.length,
        calories: slotLogs.reduce((s, l) => s + (l.total_calories || 0), 0),
        protein: slotLogs.reduce((s, l) => s + (l.total_protein || 0), 0),
      };
    }).filter((m) => m.count > 0);

    res.json({
      date,
      consumed,
      targets,
      onboarding_required: targets.calories === null,
      remaining: {
        calories: targets.calories !== null ? Math.max(0, targets.calories - consumed.calories) : null,
        protein: targets.protein !== null ? Math.max(0, targets.protein - consumed.protein) : null,
        carbs: targets.carbs !== null ? Math.max(0, targets.carbs - consumed.carbs) : null,
        fat: targets.fat !== null ? Math.max(0, targets.fat - consumed.fat) : null,
      },
      progress: {
        calories: targets.calories ? Math.min(100, Math.round((consumed.calories / targets.calories) * 100)) : 0,
        protein: targets.protein ? Math.min(100, Math.round((consumed.protein / targets.protein) * 100)) : 0,
        carbs: targets.carbs ? Math.min(100, Math.round((consumed.carbs / targets.carbs) * 100)) : 0,
        fat: targets.fat ? Math.min(100, Math.round((consumed.fat / targets.fat) * 100)) : 0,
      },
      meals_logged: logs.length,
      meal_breakdown: mealBreakdown,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/food/history — Food log history (paginated) ──
router.get('/history', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 7, 30);
    const offset = (page - 1) * limit;

    const logs = await db('food_logs')
      .where({ user_id: req.user.id })
      .orderBy('log_date', 'desc')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const total = await db('food_logs')
      .where({ user_id: req.user.id })
      .count('id as count')
      .first();

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total: parseInt(total.count),
        pages: Math.ceil(parseInt(total.count) / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/food/frequent — User's most logged meals ──
router.get('/frequent', async (req, res, next) => {
  try {
    const rows = await db('food_logs')
      .select('raw_input', 'meal_slot')
      .avg('total_calories as avg_calories')
      .avg('total_protein as avg_protein')
      .avg('total_carbs as avg_carbs')
      .avg('total_fat as avg_fat')
      .count('id as log_count')
      .where({ user_id: req.user.id })
      .whereNotNull('raw_input')
      .groupBy('raw_input', 'meal_slot')
      .orderBy('log_count', 'desc')
      .limit(8);

    const frequent = rows.map((r) => ({
      raw_input: r.raw_input,
      meal_slot: r.meal_slot,
      calories: Math.round(parseFloat(r.avg_calories) || 0),
      protein: Math.round(parseFloat(r.avg_protein) || 0),
      carbs: Math.round(parseFloat(r.avg_carbs) || 0),
      fat: Math.round(parseFloat(r.avg_fat) || 0),
      count: parseInt(r.log_count),
    }));

    res.json({ frequent });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/food/streak — Current logging streak ──
router.get('/streak', async (req, res, next) => {
  try {
    // Get distinct log dates for the user, ordered descending
    const rows = await db('food_logs')
      .distinct('log_date')
      .where({ user_id: req.user.id })
      .orderBy('log_date', 'desc');

    const dates = rows.map((r) => r.log_date);

    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if today has a log — if not, check from yesterday
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let checkDate;
    if (dates.length > 0 && dates[0] === todayStr) {
      checkDate = new Date(today);
    } else if (dates.length > 0 && dates[0] === yesterdayStr) {
      checkDate = new Date(yesterday);
    } else {
      // No recent logs
      return res.json({ current_streak: 0, total_logged_days: dates.length });
    }

    // Count consecutive days
    const dateSet = new Set(dates);
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (dateSet.has(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    res.json({
      current_streak: currentStreak,
      total_logged_days: dates.length,
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/food/quick-log — Re-log a previously logged meal ──
router.post('/quick-log', validate(quickLogSchema), async (req, res, next) => {
  try {
    const { raw_input, meal_slot } = req.validated;

    // Find the most recent log with the same raw_input
    const previousLog = await db('food_logs')
      .where({ user_id: req.user.id, raw_input })
      .orderBy('created_at', 'desc')
      .first();

    if (!previousLog) {
      return res.status(404).json({ error: 'No previous log found for this meal.' });
    }

    // Get items from the previous log
    const previousItems = await db('food_log_items')
      .where({ food_log_id: previousLog.id });

    if (previousItems.length === 0) {
      return res.status(404).json({ error: 'Previous log has no items.' });
    }

    const today = new Date().toISOString().split('T')[0];
    const logId = uuidv4();
    const slot = meal_slot || previousLog.meal_slot;

    await db.transaction(async (trx) => {
      // Create new food log (copy from previous)
      await trx('food_logs').insert({
        id: logId,
        user_id: req.user.id,
        log_date: today,
        meal_slot: slot,
        raw_input,
        total_calories: previousLog.total_calories,
        total_protein: previousLog.total_protein,
        total_carbs: previousLog.total_carbs,
        total_fat: previousLog.total_fat,
        total_fibre: previousLog.total_fibre,
        total_sugar: previousLog.total_sugar,
        total_sodium: previousLog.total_sodium,
        is_cached: true,
        user_edited: false,
      });

      // Copy items
      const newItems = previousItems.map((item) => ({
        id: uuidv4(),
        food_log_id: logId,
        food_name: item.food_name,
        food_name_hi: item.food_name_hi || '',
        quantity: item.quantity,
        unit: item.unit,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        fibre: item.fibre || 0,
        sugar: item.sugar || 0,
        sodium: item.sodium || 0,
        confidence_score: 1.0,
        from_cache: true,
      }));

      await trx('food_log_items').insert(newItems);

      // Update usage limits
      const existing = await trx('usage_limits')
        .where({ user_id: req.user.id, limit_date: today })
        .first();

      if (existing) {
        await trx('usage_limits')
          .where({ id: existing.id })
          .update({ food_logs_used: existing.food_logs_used + 1 });
      } else {
        await trx('usage_limits').insert({
          id: uuidv4(),
          user_id: req.user.id,
          limit_date: today,
          food_logs_used: 1,
          coach_messages_used: 0,
          food_logs_max: req.user.tier === 'premium' ? 999 : 5,
          coach_messages_max: req.user.tier === 'premium' ? 999 : 10,
        });
      }
    });

    // Fetch the created log
    const foodLog = await db('food_logs').where({ id: logId }).first();
    const foodLogItems = await db('food_log_items').where({ food_log_id: logId });

    res.status(201).json({
      food_log: { ...foodLog, items: foodLogItems },
    });
  } catch (err) {
    console.error('Quick-log error:', err);
    next(err);
  }
});

// ── GET /api/food/search — Fuzzy search foods ──
router.get('/search', validate(searchFoodSchema), async (req, res, next) => {
  try {
    const { query, limit } = req.validated;
    const results = await nutritionService.search(query, limit);
    res.json({ results });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/food/match — Find best match for a string ──
router.get('/match', validate(matchFoodSchema), async (req, res, next) => {
  try {
    const { name } = req.validated;
    const result = await nutritionService.match(name);
    res.json({ match: result });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/food/calculate — Calculate precise macros ──
router.post('/calculate', validate(calculateFoodSchema), async (req, res, next) => {
  try {
    const { name, quantity, unit } = req.validated;
    const result = await nutritionService.calculate(name, quantity, unit);
    if (!result) {
      return res.status(404).json({ error: 'Food not found or calculation failed' });
    }
    res.json({ result });
  } catch (err) {
    next(err);
  }
});

export default router;
