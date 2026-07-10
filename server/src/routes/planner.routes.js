/**
 * Planner Routes + Controller
 * Handles AI-generated daily workout plans, completion, and history
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/auth.middleware.js';
import db from '../db/connection.js';
import { generateWorkoutPlan } from '../services/workout-generator.service.js';

const router = Router();
router.use(authenticate);

// ── GET /api/planner/today — Fetch or auto-generate today's workout ──
router.get('/today', async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Check if plan already exists for today
    let plan = await db('workout_plans')
      .where({ user_id: req.user.id, plan_date: today })
      .first();

    if (!plan) {
      // Auto-generate a baseline plan
      const profile = await db('user_profiles')
        .where({ user_id: req.user.id })
        .first();

      if (!profile || !profile.onboarding_complete) {
        return res.json({ plan: null, needs_onboarding: true });
      }

      // Check if yesterday was missed
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const yesterdayPlan = await db('workout_plans')
        .where({ user_id: req.user.id, plan_date: yesterdayStr })
        .first();
      const missedYesterday = yesterdayPlan && yesterdayPlan.status !== 'completed';

      const dailyCheckin = { energy: 'normal', soreness: 'none', missedYesterday };
      const generated = await generateWorkoutPlan(profile, dailyCheckin);

      const planData = {
        difficulty: generated.difficulty,
        warm_up: JSON.stringify(generated.warm_up),
        workout: JSON.stringify(generated.workout),
        cool_down: JSON.stringify(generated.cool_down),
        estimated_duration_min: generated.estimated_duration_min,
        estimated_calories_burn: generated.estimated_calories_burn,
        is_rest_day: generated.is_rest_day,
        rest_reason: (generated.rest_reason || '').substring(0, 255),
        coach_tip: generated.coach_tip || null,
        status: 'pending',
        feedback: null,
        feedback_notes: null,
        completed_exercises: '[]',
      };

      const planId = uuidv4();
      await db('workout_plans').insert({
        id: planId,
        user_id: req.user.id,
        plan_date: today,
        ...planData,
      });

      plan = await db('workout_plans').where({ id: planId }).first();
    }

    res.json({ plan: parsePlanFields(plan) });
  } catch (err) {
    console.error('Planner today error:', err);
    next(err);
  }
});

// ── GET /api/planner/week/:date — Fetch all plans for the week containing :date ──
router.get('/week/:date', async (req, res, next) => {
  try {
    const refDate = new Date(req.params.date + 'T00:00:00');
    if (isNaN(refDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    // Calculate Monday–Sunday of the week
    const dayOfWeek = refDate.getDay(); // 0=Sun
    const startOfWeek = new Date(refDate);
    startOfWeek.setDate(refDate.getDate() - dayOfWeek);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const startStr = startOfWeek.toISOString().split('T')[0];
    const endStr = endOfWeek.toISOString().split('T')[0];

    const plans = await db('workout_plans')
      .where({ user_id: req.user.id })
      .whereBetween('plan_date', [startStr, endStr])
      .orderBy('plan_date', 'asc');

    res.json({
      plans: plans.map(parsePlanFields),
      range: { start: startStr, end: endStr },
    });
  } catch (err) {
    console.error('Planner week error:', err);
    next(err);
  }
});

// ── GET /api/planner/date/:date — Fetch plan for a specific date ──
router.get('/date/:date', async (req, res, next) => {
  try {
    const dateStr = req.params.date;
    const plan = await db('workout_plans')
      .where({ user_id: req.user.id, plan_date: dateStr })
      .first();

    res.json({ plan: plan ? parsePlanFields(plan) : null });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/planner/regenerate — Force regenerate today's plan ──
router.post('/regenerate', async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { energy, soreness, missedYesterday, reason } = req.body || {};

    const profile = await db('user_profiles')
      .where({ user_id: req.user.id })
      .first();

    if (!profile) {
      return res.status(400).json({ error: 'Profile not found.' });
    }

    const dailyCheckin = { energy, soreness, missedYesterday, reason };
    const generated = await generateWorkoutPlan(profile, dailyCheckin);

    // Upsert plan
    const existing = await db('workout_plans')
      .where({ user_id: req.user.id, plan_date: today })
      .first();

    const planData = {
      difficulty: generated.difficulty,
      warm_up: JSON.stringify(generated.warm_up),
      workout: JSON.stringify(generated.workout),
      cool_down: JSON.stringify(generated.cool_down),
      estimated_duration_min: generated.estimated_duration_min,
      estimated_calories_burn: generated.estimated_calories_burn,
      is_rest_day: generated.is_rest_day,
      rest_reason: (generated.rest_reason || '').substring(0, 255),
      coach_tip: generated.coach_tip || null,
      status: 'pending',
      feedback: null,
      feedback_notes: null,
      completed_exercises: '[]',
    };

    let planId;
    if (existing) {
      await db('workout_plans').where({ id: existing.id }).update(planData);
      planId = existing.id;
    } else {
      planId = uuidv4();
      await db('workout_plans').insert({ id: planId, user_id: req.user.id, plan_date: today, ...planData });
    }

    const plan = await db('workout_plans').where({ id: planId }).first();
    res.json({ plan: parsePlanFields(plan) });
  } catch (err) {
    console.error('Planner regenerate error:', err);
    next(err);
  }
});

// ── PUT /api/planner/:id/exercises — Update completed exercises (individual toggle) ──
router.put('/:id/exercises', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { completed_exercises } = req.body;

    const plan = await db('workout_plans')
      .where({ id, user_id: req.user.id })
      .first();

    if (!plan) return res.status(404).json({ error: 'Workout plan not found' });

    await db('workout_plans').where({ id }).update({
      completed_exercises: JSON.stringify(completed_exercises || []),
      updated_at: db.fn.now(),
    });

    const updated = await db('workout_plans').where({ id }).first();
    res.json({ plan: parsePlanFields(updated) });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/planner/:id/complete — Mark workout complete ──
router.put('/:id/complete', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { feedback, feedback_notes, completed_exercises } = req.body;

    const plan = await db('workout_plans')
      .where({ id, user_id: req.user.id })
      .first();

    if (!plan) return res.status(404).json({ error: 'Workout plan not found' });

    await db('workout_plans').where({ id }).update({
      status: 'completed',
      feedback: feedback || null,
      feedback_notes: feedback_notes || null,
      completed_exercises: JSON.stringify(completed_exercises || []),
      updated_at: db.fn.now(),
    });

    const updated = await db('workout_plans').where({ id }).first();
    res.json({ plan: parsePlanFields(updated) });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/planner/feedback — Save workout feedback ──
router.post('/feedback', async (req, res, next) => {
  try {
    const { plan_id, feedback, feedback_notes } = req.body;
    if (!plan_id || !feedback) {
      return res.status(400).json({ error: 'plan_id and feedback are required' });
    }

    const plan = await db('workout_plans')
      .where({ id: plan_id, user_id: req.user.id })
      .first();

    if (!plan) return res.status(404).json({ error: 'Workout plan not found' });

    await db('workout_plans').where({ id: plan_id }).update({
      feedback,
      feedback_notes: feedback_notes || null,
      updated_at: db.fn.now(),
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/planner/history — Paginated workout history ──
router.get('/history', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 14, 30);
    const offset = (page - 1) * limit;

    const plans = await db('workout_plans')
      .where({ user_id: req.user.id })
      .orderBy('plan_date', 'desc')
      .limit(limit)
      .offset(offset);

    const total = await db('workout_plans')
      .where({ user_id: req.user.id })
      .count('id as count')
      .first();

    res.json({
      plans: plans.map(parsePlanFields),
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

// ── Helper: parse JSONB fields ──
function parsePlanFields(plan) {
  if (!plan) return null;
  return {
    ...plan,
    warm_up: parseJson(plan.warm_up, []),
    workout: parseJson(plan.workout, []),
    cool_down: parseJson(plan.cool_down, []),
    completed_exercises: parseJson(plan.completed_exercises, []),
    coach_tip: plan.coach_tip || null,
  };
}

function parseJson(val, fallback) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

export default router;
