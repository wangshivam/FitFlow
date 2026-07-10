/**
 * TDEE & Macro Calculation Service
 * Uses Mifflin-St Jeor equation for BMR
 */

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_CALORIE_ADJUSTMENTS = {
  weight_loss: -500,
  muscle_gain: 300,
  stamina: 0,
  flexibility: 0,
  general: 0,
};

// Macro splits as percentage of calories
const MACRO_SPLITS = {
  weight_loss: { protein: 0.40, carbs: 0.30, fat: 0.30 },
  muscle_gain: { protein: 0.30, carbs: 0.45, fat: 0.25 },
  stamina: { protein: 0.25, carbs: 0.55, fat: 0.20 },
  flexibility: { protein: 0.25, carbs: 0.50, fat: 0.25 },
  general: { protein: 0.25, carbs: 0.50, fat: 0.25 },
};

/**
 * Calculate BMR using Mifflin-St Jeor equation
 * @param {number} weightKg
 * @param {number} heightCm
 * @param {number} age
 * @param {string} gender - 'male' | 'female' | 'other'
 * @returns {number} BMR in kcal/day
 */
export function calculateBMR(weightKg, heightCm, age, gender) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;

  switch (gender) {
    case 'male':
      return Math.round(base + 5);
    case 'female':
      return Math.round(base - 161);
    default:
      // For 'other', use average of male and female
      return Math.round(base - 78);
  }
}

/**
 * Calculate TDEE (Total Daily Energy Expenditure)
 * @param {number} bmr
 * @param {string} activityLevel
 * @returns {number} TDEE in kcal/day
 */
export function calculateTDEE(bmr, activityLevel) {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.55;
  return Math.round(bmr * multiplier);
}

/**
 * Calculate daily calorie target based on goal
 * @param {number} tdee
 * @param {string} goal
 * @returns {number} Daily calorie target
 */
export function calculateCalorieTarget(tdee, goal) {
  const adjustment = GOAL_CALORIE_ADJUSTMENTS[goal] || 0;
  const target = tdee + adjustment;

  // Safety: never go below 1200 for women or 1500 for men
  return Math.max(target, 1200);
}

/**
 * Calculate macro targets in grams
 * @param {number} calorieTarget
 * @param {string} goal
 * @returns {{ protein: number, carbs: number, fat: number }}
 */
export function calculateMacroTargets(calorieTarget, goal) {
  const split = MACRO_SPLITS[goal] || MACRO_SPLITS.general;

  return {
    protein: Math.round((calorieTarget * split.protein) / 4), // 4 cal per gram
    carbs: Math.round((calorieTarget * split.carbs) / 4),     // 4 cal per gram
    fat: Math.round((calorieTarget * split.fat) / 9),          // 9 cal per gram
  };
}

/**
 * Calculate all nutrition targets from profile data
 * @param {{ weight_kg, height_cm, age, gender, activity_level, goal }} profile
 * @returns {{ bmr, tdee, daily_calorie_target, daily_protein_target, daily_carb_target, daily_fat_target }}
 */
export function calculateAllTargets(profile) {
  const { weight_kg, height_cm, age, gender, activity_level, goal } = profile;

  const bmr = calculateBMR(weight_kg, height_cm, age, gender);
  const tdee = calculateTDEE(bmr, activity_level);
  const daily_calorie_target = calculateCalorieTarget(tdee, goal);
  const macros = calculateMacroTargets(daily_calorie_target, goal);

  return {
    bmr,
    tdee,
    daily_calorie_target,
    daily_protein_target: macros.protein,
    daily_carb_target: macros.carbs,
    daily_fat_target: macros.fat,
  };
}
