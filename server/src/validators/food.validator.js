import { z } from 'zod';

// ── Parsed food item from LLM (NO MACROS) ──
export const llmParsedFoodItemSchema = z.object({
  food_name: z.string().min(1),
  food_name_hi: z.string().default(''),
  quantity: z.number().min(0.1).max(100),
  unit: z.enum([
    'piece', 'katori', 'plate', 'glass', 'cup', 'scoop',
    'gram', 'ml', 'tablespoon', 'handful', 'slice', 'bowl', 'packet'
  ]),
  confidence: z.number().min(0).max(1).default(0.8),
});

// ── LLM response shape (v3) ──
export const llmResponseSchema = z.object({
  items: z.array(llmParsedFoodItemSchema).min(1).max(20),
  meal_suggestion: z.enum([
    'breakfast', 'morning_chai', 'lunch', 'evening_snack',
    'dinner', 'pre_workout', 'post_workout',
  ]).optional().default('lunch'),
  needs_clarification: z.boolean().optional().default(false),
  clarification_question: z.string().nullable().optional().default(null),
});

// ── Food parse request (user input) ──
export const foodParseSchema = z.object({
  raw_input: z.string()
    .min(2, 'Please describe what you ate')
    .max(500, 'Description too long'),
  meal_slot: z.enum([
    'breakfast', 'morning_chai', 'lunch', 'evening_snack',
    'dinner', 'pre_workout', 'post_workout',
  ]).optional(),
});

// ── Food log confirmation (save parsed items) ──
export const foodLogSchema = z.object({
  meal_slot: z.enum([
    'breakfast', 'morning_chai', 'lunch', 'evening_snack',
    'dinner', 'pre_workout', 'post_workout',
  ]),
  raw_input: z.string().min(1),
  items: z.array(z.object({
    food_name: z.string().min(1),
    food_name_hi: z.string().default(''),
    quantity: z.number().min(0.1).max(100),
    unit: z.string().min(1),
    gram_weight: z.number().min(0).optional(),
    calories: z.number().int().min(0).max(3000),
    protein: z.number().min(0).max(200),
    carbs: z.number().min(0).max(500),
    fat: z.number().min(0).max(200),
    fibre: z.number().min(0).max(100).default(0),
    sugar: z.number().min(0).max(200).default(0),
    sodium: z.number().min(0).max(5000).default(0),
    confidence: z.number().min(0).max(1).default(0.8),
    source: z.string().default('db'),
  })).min(1).max(20),
  log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
});

// ── Food log update ──
export const foodLogUpdateSchema = z.object({
  items: z.array(z.object({
    id: z.string().uuid().optional(),
    food_name: z.string().min(1),
    food_name_hi: z.string().default(''),
    quantity: z.number().min(0.1).max(100),
    unit: z.string().min(1),
    calories: z.number().int().min(0).max(3000),
    protein: z.number().min(0).max(200),
    carbs: z.number().min(0).max(500),
    fat: z.number().min(0).max(200),
    fibre: z.number().min(0).max(100).default(0),
    sugar: z.number().min(0).max(200).default(0),
    sodium: z.number().min(0).max(5000).default(0),
  })).min(1).max(20),
});

// ── Quick-log request (re-log a frequent meal) ──
export const quickLogSchema = z.object({
  raw_input: z.string().min(1),
  meal_slot: z.enum([
    'breakfast', 'morning_chai', 'lunch', 'evening_snack',
    'dinner', 'pre_workout', 'post_workout',
  ]).optional(),
});

// ── New API Endpoints ──
export const searchFoodSchema = z.object({
  query: z.string().min(2, 'Query must be at least 2 characters'),
  limit: z.number().int().min(1).max(50).optional().default(10),
});

export const matchFoodSchema = z.object({
  name: z.string().min(1),
});

export const calculateFoodSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().min(0.1).max(100).optional().default(1),
  unit: z.string().optional().default('piece'),
});

export function validate(schema) {
  return (req, res, next) => {
    const data = req.method === 'GET' ? req.query : req.body;
    
    // For GET requests, query params are always strings, so we need to parse numeric fields if necessary.
    // Zod's `coerce` or manual parsing can handle it, but here we'll just attempt a parse.
    // Let's rely on Zod's parsing capabilities. If a schema uses z.number(), req.query['limit'] will be a string.
    // To fix this globally without changing all schemas to coerce, we'll try to convert known numeric fields if they exist in query.
    if (req.method === 'GET' && data.limit) data.limit = parseInt(data.limit, 10);
    
    const result = schema.safeParse(data);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return res.status(400).json({ error: 'Validation failed', errors });
    }
    req.validated = result.data;
    next();
  };
}
