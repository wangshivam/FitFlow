/**
 * Workout Generator Service
 * Calls Groq (LLaMA) to generate a personalized daily workout plan
 */

import Groq from 'groq-sdk';
import {
  WORKOUT_GENERATOR_SYSTEM_PROMPT,
  buildWorkoutGeneratorPrompt,
} from '../prompts/workout-generator.prompt.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Generate a workout plan for a user profile using Groq LLaMA
 * @param {Object} profile - user_profiles row
 * @param {Object} dailyCheckin - user's daily check-in (energy, soreness, missedYesterday)
 * @returns {Promise<Object>} Structured workout plan
 */
export async function generateWorkoutPlan(profile, dailyCheckin = {}) {
  const userPrompt = buildWorkoutGeneratorPrompt(profile, dailyCheckin);

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 2048,
    messages: [
      { role: 'system', content: WORKOUT_GENERATOR_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
  });

  const text = response.choices[0]?.message?.content || '';

  // Strip any markdown wrappers
  const jsonStr = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (err) {
    throw new Error(`Failed to parse workout JSON from LLM: ${text.substring(0, 300)}`);
  }

  // Normalise and validate
  return {
    is_rest_day: Boolean(parsed.is_rest_day),
    rest_reason: parsed.rest_reason || null,
    difficulty: parsed.difficulty || 'moderate',
    estimated_duration_min: parsed.estimated_duration_min || 30,
    estimated_calories_burn: parsed.estimated_calories_burn || 200,
    warm_up: Array.isArray(parsed.warm_up) ? parsed.warm_up : [],
    workout: Array.isArray(parsed.workout) ? parsed.workout : [],
    cool_down: Array.isArray(parsed.cool_down) ? parsed.cool_down : [],
    coach_tip: parsed.coach_tip || 'Stay consistent — every rep counts!',
  };
}

export default { generateWorkoutPlan };
