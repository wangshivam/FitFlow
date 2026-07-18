/**
 * Food Parser Service — Pipeline v5.0 (Single-Shot LLM Macro Estimation)
 *
 * Replaces the old 4-layer resolution system with a direct call to the LLM
 * to estimate macros in a single pass based on the Expert Nutritionist prompt.
 */

import Groq from 'groq-sdk';
import { llmResponseSchema } from '../validators/food.validator.js';
import {
  FOOD_PARSER_SYSTEM_PROMPT,
  buildFoodParserUserPrompt,
} from '../prompts/food-parser.prompt.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Call Groq LLaMA to parse food items and estimate macros from natural language
 */
async function parseWithLLM(rawInput) {
  const userPrompt = buildFoodParserUserPrompt(rawInput);

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 1024,
    messages: [
      { role: 'system', content: FOOD_PARSER_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
  });

  const text = response.choices[0]?.message?.content || '';

  let parsed;
  try {
    const jsonStr = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    parsed = JSON.parse(jsonStr);
  } catch (err) {
    throw new Error(`Failed to parse LLM response as JSON: ${text.substring(0, 200)}`);
  }

  const validation = llmResponseSchema.safeParse(parsed);
  if (!validation.success) {
    console.error('LLM response validation failed:', validation.error.errors);
    throw new Error('LLM response did not match expected format');
  }

  return validation.data;
}

/**
 * Main food parsing pipeline — Single-shot LLM Macro Estimation
 * @param {string} rawInput - Natural language food description
 */
export async function parseFood(rawInput) {
  const parsedArray = await parseWithLLM(rawInput);

  // Map the strict JSON array into the expected API item format
  const calculatedItems = parsedArray.map(item => ({
    food_name: item.food_name,
    food_name_hi: '',
    quantity: item.quantity,
    unit: item.unit,
    gram_weight: null,
    calories: Math.round(item.calories || 0),
    protein: parseFloat((item.protein || 0).toFixed(1)),
    carbs: parseFloat((item.carbs || 0).toFixed(1)),
    fat: parseFloat((item.fats || 0).toFixed(1)), // Map 'fats' to 'fat' for the DB
    fibre: 0,
    sugar: 0,
    sodium: 0,
    confidence: 0.9,
    source: 'llm_direct',
  }));

  // Construct the legacy response object format expected by the frontend
  return {
    items: calculatedItems,
    meal_suggestion: 'lunch', // Defaulted, as the new prompt doesn't ask for it
    needs_clarification: false, // Defaulted
    clarification_question: null,
    has_estimated_items: true,
    raw_input: rawInput,
  };
}

export default { parseFood };
