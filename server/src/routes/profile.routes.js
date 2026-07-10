import { Router } from 'express';
import db from '../db/connection.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { onboardingSchema, validate } from '../validators/auth.validator.js';
import { calculateAllTargets } from '../services/tdee.service.js';

const router = Router();

// All profile routes require authentication
router.use(authenticate);

// ── Get Profile ──
router.get('/', async (req, res, next) => {
  try {
    const profile = await db('user_profiles')
      .where({ user_id: req.user.id })
      .first();

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ profile });
  } catch (err) {
    next(err);
  }
});

// ── Complete Onboarding ──
router.post('/onboarding', validate(onboardingSchema), async (req, res, next) => {
  try {
    const data = req.validated;

    // Calculate TDEE and macro targets
    const targets = calculateAllTargets(data);

    // Update profile
    const [profile] = await db('user_profiles')
      .where({ user_id: req.user.id })
      .update({
        ...data,
        ...targets,
        health_conditions: JSON.stringify(data.health_conditions),
        onboarding_complete: true,
        updated_at: db.fn.now(),
      })
      .returning('*');

    // Update user's last active
    await db('users').where({ id: req.user.id }).update({
      last_active_date: new Date().toISOString().split('T')[0],
    });

    res.json({
      profile,
      user: { id: req.user.id },
      targets,
    });
  } catch (err) {
    next(err);
  }
});

// ── Update Profile ──
router.put('/', async (req, res, next) => {
  try {
    const allowedFields = [
      'age', 'gender', 'height_cm', 'weight_kg', 'target_weight_kg',
      'goal', 'activity_level', 'workout_preference', 'equipment',
      'diet_type', 'health_conditions', 'city', 'state',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = field === 'health_conditions'
          ? JSON.stringify(req.body[field])
          : req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Recalculate targets if body/goal/activity changed
    const needsRecalc = ['weight_kg', 'height_cm', 'age', 'gender', 'activity_level', 'goal']
      .some((f) => updates[f] !== undefined);

    if (needsRecalc) {
      const currentProfile = await db('user_profiles')
        .where({ user_id: req.user.id })
        .first();

      const merged = { ...currentProfile, ...updates };
      if (merged.health_conditions && typeof merged.health_conditions === 'string') {
        merged.health_conditions = JSON.parse(merged.health_conditions);
      }

      const targets = calculateAllTargets(merged);
      Object.assign(updates, targets);
    }

    updates.updated_at = db.fn.now();

    const [profile] = await db('user_profiles')
      .where({ user_id: req.user.id })
      .update(updates)
      .returning('*');

    res.json({ profile });
  } catch (err) {
    next(err);
  }
});

export default router;
