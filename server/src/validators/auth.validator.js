import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const onboardingSchema = z.object({
  age: z.number().int().min(14).max(80),
  gender: z.enum(['male', 'female', 'other']),
  height_cm: z.number().min(100).max(250),
  weight_kg: z.number().min(30).max(200),
  target_weight_kg: z.number().min(30).max(200),
  goal: z.enum(['weight_loss', 'muscle_gain', 'stamina', 'flexibility', 'general']),
  activity_level: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  workout_preference: z.enum(['home', 'gym', 'outdoor', 'mixed']),
  equipment: z.enum(['none', 'basic', 'full_gym']),
  diet_type: z.enum(['veg', 'non_veg', 'eggetarian', 'vegan']),
  health_conditions: z.array(z.string()).default([]),
  city: z.string().max(100).optional().default(''),
});

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
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
