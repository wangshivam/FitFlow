/**
 * Payment Routes — Razorpay Subscription Integration
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { authenticate } from '../middleware/auth.middleware.js';
import db from '../db/connection.js';

const router = Router();
router.use(authenticate);

const PREMIUM_AMOUNT_PAISE = 29900; // ₹299/month

// Lazy-load Razorpay to avoid crash if keys not set
async function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay keys not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
  }
  const { default: Razorpay } = await import('razorpay');
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// ── GET /api/payment/status — Current subscription status ──
router.get('/status', async (req, res, next) => {
  try {
    const sub = await db('subscriptions')
      .where({ user_id: req.user.id })
      .orderBy('created_at', 'desc')
      .first();

    res.json({
      tier: req.user.tier || 'free',
      subscription: sub || null,
      is_premium: req.user.tier === 'premium',
    });
  } catch (err) { next(err); }
});

// ── POST /api/payment/create-order — Create Razorpay order ──
router.post('/create-order', async (req, res, next) => {
  try {
    const instance = getRazorpay();

    const order = await instance.orders.create({
      amount: PREMIUM_AMOUNT_PAISE,
      currency: 'INR',
      receipt: `fitflow_${req.user.id.substring(0, 8)}_${Date.now()}`,
      notes: {
        user_id: req.user.id,
        plan: 'premium_monthly',
      },
    });

    res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Razorpay create-order error:', err);
    if (err.message?.includes('not configured')) {
      return res.status(503).json({ error: 'Payment gateway not configured. Contact support.' });
    }
    next(err);
  }
});

// ── POST /api/payment/verify — Verify payment & upgrade user ──
router.post('/verify', async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification fields' });
    }

    // Verify signature
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    await db.transaction(async (trx) => {
      // Create subscription record
      await trx('subscriptions').insert({
        id: uuidv4(),
        user_id: req.user.id,
        plan: 'premium',
        status: 'active',
        razorpay_payment_id,
        amount_paise: PREMIUM_AMOUNT_PAISE,
        starts_at: now,
        expires_at: expiresAt,
      });

      // Upgrade user tier
      await trx('users').where({ id: req.user.id }).update({ tier: 'premium' });

      // Update usage limits to unlimited
      const todayStr = now.toISOString().split('T')[0];
      const usageRow = await trx('usage_limits')
        .where({ user_id: req.user.id, limit_date: todayStr })
        .first();

      if (usageRow) {
        await trx('usage_limits').where({ id: usageRow.id }).update({
          food_logs_max: 999,
          coach_messages_max: 999,
        });
      }
    });

    res.json({
      success: true,
      message: '🎉 Welcome to FitFlow Premium! Your account has been upgraded.',
      expires_at: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error('Payment verify error:', err);
    next(err);
  }
});

export default router;
