/**
 * Food Parser Service — Pipeline v4.0
 *
 * 4-Layer Food Resolution Pipeline:
 *   Layer 1: indian_food_cache  — exact match + alias + fuzzy (instant, no API)
 *   Layer 2: nutrition.service  — normalized DB with pg_trgm fuzzy search
 *   Layer 3: LLM macro estimate — Groq estimates macros as last resort
 *   Layer 4: Never return 0     — always recover with some estimate
 *
 * Text normalization handles: daal→dal, chapathi→chapati, aaloo→aloo, etc.
 * Confidence gating: ≥0.80 auto, 0.65–0.79 confirm, <0.65 clarify
 */

import Groq from 'groq-sdk';
import nutritionService from './nutrition.service.js';
import foodCacheService from './food-cache.service.js';
import { llmResponseSchema } from '../validators/food.validator.js';
import {
  FOOD_PARSER_SYSTEM_PROMPT,
  buildFoodParserUserPrompt,
} from '../prompts/food-parser.prompt.js';
import {
  MACRO_ESTIMATOR_SYSTEM_PROMPT,
  buildMacroEstimatorPrompt,
} from '../prompts/macro-estimator.prompt.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Text Normalization Dictionary ──────────────────────────────────────────
const NORMALIZATION_MAP = {
  // Dal variants
  'daal': 'dal', 'dhal': 'dal', 'dhal fry': 'dal fry', 'daal fry': 'dal fry',
  'daal tadka': 'dal tadka', 'dhal tadka': 'dal tadka',
  'lentil': 'dal', 'lentils': 'dal', 'lentil soup': 'dal',
  'arhar': 'dal', 'toor': 'dal', 'tuvar': 'dal',
  // Roti variants
  'chapathi': 'chapati', 'chappati': 'chapati', 'chappatti': 'chapati',
  'chapathi roti': 'roti', 'phulka': 'roti', 'fulka': 'roti',
  // Rice variants
  'chawl': 'chawal', 'chaval': 'chawal',
  // Potato variants
  'aaloo': 'aloo', 'alou': 'aloo', 'alu': 'aloo',
  // Rajma variants
  'rajmah': 'rajma', 'rajmaa': 'rajma',
  // Chole variants
  'chhole': 'chole', 'chana': 'chole', 'channna': 'chole',
  // Paneer variants
  'panir': 'paneer', 'pnr': 'paneer',
  // Misc
  'gobhi': 'gobi', 'govi': 'gobi',
  'bhindi': 'bhindi', 'bhindee': 'bhindi', 'bhende': 'bhindi',
  'palak': 'spinach', 'saag': 'spinach',
  'murg': 'chicken', 'murgh': 'chicken',
  'machli': 'fish', 'machali': 'fish',
  'anda': 'egg', 'anday': 'egg', 'ande': 'egg',
  'dudh': 'milk', 'doodh': 'milk',
  'dahi': 'curd', 'doi': 'curd',
  'chaas': 'buttermilk', 'chaach': 'buttermilk', 'mattha': 'buttermilk',
  'chai tea': 'chai', 'tea': 'chai',
  'nimbu': 'lemon', 'nimboo': 'lemon',
  'kela': 'banana', 'kele': 'banana',
  'seb': 'apple',
  'aam': 'mango',
  'badam': 'almonds',
  'akhrot': 'walnuts',
  'ghee roti': 'roti',
};

/**
 * Normalize food name for better matching.
 * Handles common Hinglish spelling variations.
 */
function normalizeText(text) {
  if (!text) return '';
  let normalized = text.toLowerCase().trim();
  // Remove punctuation except spaces and hyphens
  normalized = normalized.replace(/[^\w\s-]/g, '');
  // Replace hyphens with spaces
  normalized = normalized.replace(/-/g, ' ');
  // Collapse multiple spaces
  normalized = normalized.replace(/\s+/g, ' ').trim();
  // Apply normalization map
  if (NORMALIZATION_MAP[normalized]) {
    normalized = NORMALIZATION_MAP[normalized];
  }
  // Partial replacements (word-level)
  for (const [wrong, right] of Object.entries(NORMALIZATION_MAP)) {
    const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
    normalized = normalized.replace(regex, right);
  }
  return normalized.trim();
}

/**
 * Layer 1: Look up food in indian_food_cache (exact, alias, fuzzy)
 */
async function lookupInCache(foodName, quantity, unit) {
  // Ensure cache is initialized
  await foodCacheService.initialize();

  const normalized = normalizeText(foodName);
  const result = foodCacheService.lookup(normalized);

  // Also try the original if normalized didn't match
  if (!result.found && normalized !== foodName.toLowerCase()) {
    const origResult = foodCacheService.lookup(foodName.toLowerCase().trim());
    if (origResult.found) return foodCacheService.toParsedItem(origResult, quantity, unit);
  }

  if (result.found) {
    return foodCacheService.toParsedItem(result, quantity, unit);
  }
  return null;
}

/**
 * Layer 2: Look up food in normalized nutrition DB (pg_trgm fuzzy)
 */
async function lookupInNutritionDB(foodName, quantity, unit) {
  const normalized = normalizeText(foodName);
  try {
    const result = await nutritionService.calculate(normalized, quantity, unit);
    if (result) return result;
    // Try with original name if normalized didn't work
    if (normalized !== foodName.toLowerCase()) {
      return await nutritionService.calculate(foodName, quantity, unit);
    }
  } catch {
    // Silently fall through to next layer
  }
  return null;
}

/**
 * Layer 3: LLM macro estimation fallback — never returns 0 macros
 */
async function estimateMacrosWithLLM(foodName, quantity, unit) {
  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 256,
      temperature: 0.3,
      messages: [
        { role: 'system', content: MACRO_ESTIMATOR_SYSTEM_PROMPT },
        { role: 'user', content: buildMacroEstimatorPrompt(foodName, quantity, unit) },
      ],
    });

    const text = response.choices[0]?.message?.content || '';
    const jsonStr = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const estimated = JSON.parse(jsonStr);

    return {
      food_name: foodName,
      food_name_hi: '',
      quantity,
      unit,
      gram_weight: null,
      calories: Math.round(estimated.calories || 0),
      protein: parseFloat((estimated.protein || 0).toFixed(1)),
      carbs: parseFloat((estimated.carbs || 0).toFixed(1)),
      fat: parseFloat((estimated.fat || 0).toFixed(1)),
      fibre: parseFloat((estimated.fibre || 0).toFixed(1)),
      sugar: 0,
      sodium: 0,
      confidence: estimated.confidence || 0.65,
      source: 'llm_estimate',
    };
  } catch (err) {
    console.error('LLM macro estimation failed:', err.message);
    return null;
  }
}

/**
 * Layer 4: Absolute fallback — generic estimate with very low confidence
 * This ensures we NEVER return 0 macros.
 */
function genericFallback(foodName, quantity, unit) {
  // Use generic 150 kcal estimate for 1 serving of any unknown food
  const servingMultiplier = typeof quantity === 'number' ? quantity : 1;
  return {
    food_name: foodName,
    food_name_hi: '',
    quantity,
    unit,
    gram_weight: null,
    calories: Math.round(150 * servingMultiplier),
    protein: parseFloat((5 * servingMultiplier).toFixed(1)),
    carbs: parseFloat((20 * servingMultiplier).toFixed(1)),
    fat: parseFloat((5 * servingMultiplier).toFixed(1)),
    fibre: 0,
    sugar: 0,
    sodium: 0,
    confidence: 0.40,
    source: 'generic_fallback',
  };
}

/**
 * Resolve macros for a single food item through all 4 layers
 */
async function resolveMacros(foodName, quantity, unit) {
  // Layer 1: indian_food_cache
  const cacheResult = await lookupInCache(foodName, quantity, unit);
  if (cacheResult && cacheResult.calories > 0) {
    return cacheResult;
  }

  // Layer 2: Normalized nutrition DB
  const dbResult = await lookupInNutritionDB(foodName, quantity, unit);
  if (dbResult && dbResult.calories > 0) {
    return dbResult;
  }

  // Layer 3: LLM macro estimation
  const llmResult = await estimateMacrosWithLLM(foodName, quantity, unit);
  if (llmResult && llmResult.calories > 0) {
    return llmResult;
  }

  // Layer 4: Generic fallback — never 0
  return genericFallback(foodName, quantity, unit);
}

/**
 * Call Groq LLaMA to parse food items from natural language
 */
async function parseWithLLM(rawInput, dietType = null) {
  const userPrompt = buildFoodParserUserPrompt(rawInput, dietType);

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

  // Validate against NO-MACRO schema
  const validation = llmResponseSchema.safeParse(parsed);
  if (!validation.success) {
    console.error('LLM response validation failed:', validation.error.errors);
    // Best-effort fallback
    if (parsed.items && Array.isArray(parsed.items)) {
      return {
        items: parsed.items.map((item) => ({
          food_name: item.food_name || 'Unknown',
          food_name_hi: item.food_name_hi || '',
          quantity: item.quantity || 1,
          unit: item.unit || 'piece',
          confidence: item.confidence || 0.7,
        })),
        meal_suggestion: parsed.meal_suggestion || 'lunch',
        needs_clarification: parsed.needs_clarification || false,
        clarification_question: parsed.clarification_question || null,
      };
    }
    throw new Error('LLM response did not match expected format');
  }

  return validation.data;
}

/**
 * Main food parsing pipeline — 4-layer resolution
 * @param {string} rawInput - Natural language food description
 * @param {string|null} dietType - User's diet preference
 */
export async function parseFood(rawInput, dietType = null) {
  // Step 1: LLM identifies WHAT food (no macros)
  const llmResult = await parseWithLLM(rawInput, dietType);

  // Step 2: Resolve macros for each identified food through 4-layer pipeline
  const calculatedItems = [];
  let totalConfidence = 0;

  for (const item of llmResult.items) {
    const resolved = await resolveMacros(item.food_name, item.quantity, item.unit);
    // Preserve Hindi name from LLM identification if DB didn't return one
    if (!resolved.food_name_hi && item.food_name_hi) {
      resolved.food_name_hi = item.food_name_hi;
    }
    calculatedItems.push(resolved);
    totalConfidence += resolved.confidence;
  }

  const avgConfidence = calculatedItems.length > 0
    ? totalConfidence / calculatedItems.length
    : 0;

  // Confidence gating
  const needsClarification = llmResult.needs_clarification || avgConfidence < 0.65;
  const clarificationQuestion = needsClarification && !llmResult.clarification_question
    ? 'Could you give more detail about what you ate?'
    : llmResult.clarification_question;

  // Flag items that are estimated (for UI display)
  const hasEstimatedItems = calculatedItems.some(
    (i) => i.source === 'llm_estimate' || i.source === 'generic_fallback',
  );

  return {
    items: calculatedItems,
    meal_suggestion: llmResult.meal_suggestion,
    needs_clarification: needsClarification,
    clarification_question: clarificationQuestion,
    has_estimated_items: hasEstimatedItems,
    raw_input: rawInput,
  };
}

export default { parseFood };
