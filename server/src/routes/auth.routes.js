import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/connection.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { registerSchema, loginSchema, validate } from '../validators/auth.validator.js';
import { applyDeveloperOverride } from '../utils/developer.js';

const router = Router();

function generateTokens(userId) {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
  const refresh_token = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh', {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });
  return { token, refresh_token };
}

// ── Register ──
router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password } = req.validated;

    // Check if user exists
    const existing = await db('users').where({ email }).first();
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Create user
    const [user] = await db('users')
      .insert({
        name,
        email,
        password_hash,
        trial_ends_at: db.raw("NOW() + INTERVAL '30 days'"),
      })
      .returning(['id', 'name', 'email', 'language', 'tier', 'streak_days', 'created_at', 'trial_ends_at']);

    applyDeveloperOverride(user);

    // Create empty profile
    const [profile] = await db('user_profiles')
      .insert({ user_id: user.id })
      .returning('*');

    // Create initial usage limits — unlimited food logs during 30-day trial
    const today = new Date().toISOString().split('T')[0];
    await db('usage_limits').insert({
      user_id: user.id,
      limit_date: today,
      food_logs_max: 999,  // Unlimited during trial
      coach_messages_max: 3, // Always 3 coach messages/day (premium upsell)
    });

    const tokens = generateTokens(user.id);

    res.status(201).json({
      ...tokens,
      user: { ...user, avatar_url: null },
      profile,
    });
  } catch (err) {
    next(err);
  }
});

// ── Login ──
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.validated;

    const user = await db('users').where({ email }).first();
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    applyDeveloperOverride(user);

    if (!user.password_hash) {
      return res.status(401).json({ error: 'This account uses Google sign-in' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last active
    await db('users').where({ id: user.id }).update({
      last_active_date: new Date().toISOString().split('T')[0],
    });

    const profile = await db('user_profiles').where({ user_id: user.id }).first();
    const tokens = generateTokens(user.id);

    res.json({
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        language: user.language,
        tier: user.tier,
        streak_days: user.streak_days,
      },
      profile,
    });
  } catch (err) {
    next(err);
  }
});

// ── Refresh Token ──
router.post('/refresh', async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh');
    const user = await db('users').where({ id: decoded.userId }).first();

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const tokens = generateTokens(user.id);
    res.json(tokens);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// ── Get Current User ──
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const profile = await db('user_profiles').where({ user_id: req.user.id }).first();

    res.json({
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        avatar_url: req.user.avatar_url,
        language: req.user.language,
        tier: req.user.tier,
        streak_days: req.user.streak_days,
      },
      profile,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
