/**
 * Coach Routes + Controller
 * Multi-turn AI conversations with context awareness
 * Now with adaptive workout integration
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Groq from 'groq-sdk';
import { authenticate } from '../middleware/auth.middleware.js';
import db from '../db/connection.js';
import { COACH_SYSTEM_PROMPT, buildContextSnapshot } from '../prompts/coach.prompt.js';
import { calculateAllTargets } from '../services/tdee.service.js';
import { generateWorkoutPlan } from '../services/workout-generator.service.js';

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const COACH_MSG_LIMIT = 3; // 3 messages/day for free users (drives premium)

router.use(authenticate);

// ── Helper: extract ADAPT_WORKOUT action from AI response ──
function extractAdaptAction(text) {
  // Look for ```json ... ``` block containing ADAPT_WORKOUT
  const match = text.match(/```json\s*(\{[\s\S]*?"action"\s*:\s*"ADAPT_WORKOUT"[\s\S]*?\})\s*```/);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[1]);
    if (parsed.action === 'ADAPT_WORKOUT') {
      return {
        reason: parsed.reason || 'workout adjustment needed',
        adjustment: parsed.adjustment || { energy: 'low', soreness: 'none', missedYesterday: true },
      };
    }
  } catch { /* ignore parse errors */ }
  return null;
}

// ── Helper: strip the JSON action block from visible text ──
function stripAdaptAction(text) {
  return text.replace(/```json\s*\{[\s\S]*?"action"\s*:\s*"ADAPT_WORKOUT"[\s\S]*?\}\s*```/g, '').trim();
}

// ── GET /api/coach/conversations ──
router.get('/conversations', async (req, res, next) => {
  try {
    const conversations = await db('coach_conversations')
      .where({ user_id: req.user.id, is_active: true })
      .orderBy('updated_at', 'desc')
      .limit(20);

    res.json({ conversations });
  } catch (err) { next(err); }
});

// ── POST /api/coach/conversation — Create new conversation ──
router.post('/conversation', async (req, res, next) => {
  try {
    const id = uuidv4();
    await db('coach_conversations').insert({
      id,
      user_id: req.user.id,
      title: 'New Chat',
      is_active: true,
    });

    const conv = await db('coach_conversations').where({ id }).first();
    res.status(201).json({ conversation: conv });
  } catch (err) { next(err); }
});

// ── GET /api/coach/conversation/:id — Get messages ──
router.get('/conversation/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const conv = await db('coach_conversations')
      .where({ id, user_id: req.user.id })
      .first();

    if (!conv) return res.status(404).json({ error: 'Conversation not found' });

    const messages = await db('coach_messages')
      .where({ conversation_id: id })
      .orderBy('created_at', 'asc')
      .limit(100);

    res.json({ conversation: conv, messages });
  } catch (err) { next(err); }
});

// ── POST /api/coach/message — Send a message ──
router.post('/message', async (req, res, next) => {
  try {
    const { conversation_id, message } = req.body;

    if (!conversation_id || !message?.trim()) {
      return res.status(400).json({ error: 'conversation_id and message are required' });
    }

    // Verify conversation ownership
    const conv = await db('coach_conversations')
      .where({ id: conversation_id, user_id: req.user.id })
      .first();

    if (!conv) return res.status(404).json({ error: 'Conversation not found' });

    // Check daily usage limit for free users (3/day always, drives premium)
    if (req.user.tier !== 'premium') {
      const today = new Date().toISOString().split('T')[0];
      let usageRow = await db('usage_limits')
        .where({ user_id: req.user.id, limit_date: today })
        .first();

      // Upsert today's usage row if missing
      if (!usageRow) {
        const isInTrial = req.user.trial_ends_at && new Date(req.user.trial_ends_at) > new Date();
        await db('usage_limits').insert({
          user_id: req.user.id,
          limit_date: today,
          food_logs_max: isInTrial ? 999 : 3,
          coach_messages_max: COACH_MSG_LIMIT,
        });
        usageRow = { coach_messages_used: 0, coach_messages_max: COACH_MSG_LIMIT };
      }

      const used = usageRow?.coach_messages_used || 0;
      const max = usageRow?.coach_messages_max ?? COACH_MSG_LIMIT;

      if (used >= max) {
        return res.status(429).json({
          error: `You've used all ${max} AI coach messages for today. Upgrade to Premium for unlimited coaching.`,
          code: 'LIMIT_REACHED',
          limit: max,
          used,
          upgrade_url: '/premium',
        });
      }
    }

    // Build context from today's data
    const today = new Date().toISOString().split('T')[0];
    const [profile, todaySummaryRaw, todayPlanRaw] = await Promise.all([
      db('user_profiles').where({ user_id: req.user.id }).first(),
      db('food_logs')
        .where({ user_id: req.user.id, log_date: today })
        .select(db.raw("SUM(total_calories) as cal, SUM(total_protein) as prot, SUM(total_carbs) as carbs, SUM(total_fat) as fat, COUNT(*) as meals")),
      db('workout_plans').where({ user_id: req.user.id, plan_date: today }).first(),
    ]);

    // Aggregate nutrition
    const nutrition = todaySummaryRaw?.[0] || {};
    const todaySummary = {
      consumed: {
        calories: parseFloat(nutrition.cal) || 0,
        protein: parseFloat(nutrition.prot) || 0,
        carbs: parseFloat(nutrition.carbs) || 0,
        fat: parseFloat(nutrition.fat) || 0,
      },
      targets: (() => {
        if (profile?.daily_calorie_target && profile.daily_calorie_target > 0) {
          return {
            calories: profile.daily_calorie_target,
            protein: profile.daily_protein_target,
            carbs: profile.daily_carb_target,
            fat: profile.daily_fat_target,
          };
        } else if (profile?.weight_kg && profile?.height_cm && profile?.age && profile?.gender) {
          const computed = calculateAllTargets(profile);
          return {
            calories: computed.daily_calorie_target,
            protein: computed.daily_protein_target,
            carbs: computed.daily_carb_target,
            fat: computed.daily_fat_target,
          };
        }
        return { calories: null, protein: null, carbs: null, fat: null };
      })(),
      meals_logged: parseInt(nutrition.meals) || 0,
    };

    const contextSnapshot = buildContextSnapshot(
      profile ? { ...profile, name: req.user.name } : null,
      todaySummary,
      todayPlanRaw,
    );

    // Fetch recent message history (last 20)
    const history = await db('coach_messages')
      .where({ conversation_id })
      .orderBy('created_at', 'desc')
      .limit(20);

    history.reverse();

    // Build messages array with system prompt
    const groqMessages = [
      { role: 'system', content: COACH_SYSTEM_PROMPT },
      ...(contextSnapshot ? [{
        role: 'user',
        content: `[SYSTEM CONTEXT — not from user, just for your awareness]\n${contextSnapshot}`,
      }, {
        role: 'assistant',
        content: 'Got it! I have your current context. How can I help you today?',
      }] : []),
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message.trim() },
    ];

    // Call Groq LLaMA for coach responses
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      messages: groqMessages,
    });

    let assistantContent = response.choices[0]?.message?.content || '';

    const outputTokens = response.usage?.completion_tokens || 0;

    // ── Check for ADAPT_WORKOUT action ──
    const adaptAction = extractAdaptAction(assistantContent);
    let workoutAdapted = false;
    let adaptedPlan = null;

    if (adaptAction) {
      // Strip the JSON block from user-visible text
      assistantContent = stripAdaptAction(assistantContent);

      if (req.user.tier === 'premium') {
        // Premium user: auto-adapt the workout
        try {
          if (profile) {
            const dailyCheckin = {
              energy: adaptAction.adjustment?.energy || 'low',
              soreness: adaptAction.adjustment?.soreness || 'none',
              missedYesterday: adaptAction.adjustment?.missedYesterday ?? true,
              reason: adaptAction.reason,
            };

            const generated = await generateWorkoutPlan(profile, dailyCheckin);

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

            if (existing) {
              await db('workout_plans').where({ id: existing.id }).update(planData);
              adaptedPlan = existing.id;
            } else {
              const planId = uuidv4();
              await db('workout_plans').insert({
                id: planId, user_id: req.user.id, plan_date: today, ...planData,
              });
              adaptedPlan = planId;
            }

            workoutAdapted = true;
            assistantContent += '\n\n✅ **Your workout plan has been automatically adjusted.** Check your Workout tab for the updated plan!';
          }
        } catch (adaptErr) {
          console.error('Workout adaptation error:', adaptErr);
          assistantContent += '\n\n⚠️ I tried to adjust your workout, but hit a snag. You can manually regenerate from the Workout tab.';
        }
      } else {
        // Free user: show premium lock message
        assistantContent += '\n\n🔒 **Adaptive Workout Recovery is a Premium Feature.** I detected that your workout plan needs adjusting, but this feature requires a Premium subscription.\n\n[Upgrade to Premium →](/premium)';
      }
    }

    // Save user message + assistant reply
    const userMsgId = uuidv4();
    const assistantMsgId = uuidv4();

    await db.transaction(async (trx) => {
      await trx('coach_messages').insert([
        {
          id: userMsgId,
          conversation_id,
          user_id: req.user.id,
          role: 'user',
          content: message.trim(),
          context_snapshot: contextSnapshot ? JSON.stringify({ summary: 'context injected' }) : null,
          token_count: 0,
        },
        {
          id: assistantMsgId,
          conversation_id,
          user_id: req.user.id,
          role: 'assistant',
          content: assistantContent,
          token_count: outputTokens,
        },
      ]);

      // Update conversation title from first message
      if (history.length === 0) {
        const title = message.trim().substring(0, 50) + (message.length > 50 ? '…' : '');
        await trx('coach_conversations').where({ id: conversation_id }).update({
          title,
          updated_at: trx.fn.now(),
        });
      } else {
        await trx('coach_conversations').where({ id: conversation_id }).update({
          updated_at: trx.fn.now(),
        });
      }

      // Increment usage for free tier
      const todayStr = new Date().toISOString().split('T')[0];
      const usageRow = await trx('usage_limits')
        .where({ user_id: req.user.id, limit_date: todayStr })
        .first();

      if (usageRow) {
        await trx('usage_limits')
          .where({ id: usageRow.id })
          .update({ coach_messages_used: usageRow.coach_messages_used + 1 });
      } else {
        await trx('usage_limits').insert({
          id: uuidv4(),
          user_id: req.user.id,
          limit_date: todayStr,
          food_logs_used: 0,
          coach_messages_used: 1,
          food_logs_max: req.user.tier === 'premium' ? 999 : 5,
          coach_messages_max: req.user.tier === 'premium' ? 999 : COACH_MSG_LIMIT,
        });
      }
    });

    res.json({
      message: {
        id: assistantMsgId,
        role: 'assistant',
        content: assistantContent,
        created_at: new Date().toISOString(),
      },
      workout_adapted: workoutAdapted,
      adapted_plan_id: adaptedPlan,
    });
  } catch (err) {
    console.error('Coach message error:', err);
    next(err);
  }
});

// ── DELETE /api/coach/conversation/:id ──
router.delete('/conversation/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const conv = await db('coach_conversations')
      .where({ id, user_id: req.user.id })
      .first();

    if (!conv) return res.status(404).json({ error: 'Conversation not found' });

    await db('coach_conversations').where({ id }).update({ is_active: false });
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
