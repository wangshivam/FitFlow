/**
 * Seed: Servings — Standard portion sizes converted to grams
 * Maps subjective units like "katori", "piece", "plate", "glass" to precise gram weights
 * based on NIN/ICMR standards for Indian dietary assessments.
 */

/**
 * @param { import("knex").Knex } knex
 */
export async function seed(knex) {
  await knex('food_servings').del();

  const foods = await knex('foods').select('id', 'canonical_name', 'category_id');
  const cats = await knex('food_categories').select('id', 'name');
  
  const foodMap = Object.fromEntries(foods.map((f) => [f.canonical_name, f.id]));
  const catMap = Object.fromEntries(cats.map((c) => [c.id, c.name]));

  const servings = [];

  // Helper
  const addServing = (canonicalName, unitName, grams, isDefault = false) => {
    const foodId = foodMap[canonicalName];
    if (!foodId) return;

    servings.push({
      food_id: foodId,
      unit_name: unitName,
      gram_weight: grams,
      is_default: isDefault,
    });
  };

  // 1. Generic rules based on categories (applied to all foods in category if specific ones aren't defined)
  // Let's add them specifically to the foods we seeded
  for (const food of foods) {
    const catName = catMap[food.category_id];
    
    // Add default 'gram' and 'kg' for EVERYTHING
    servings.push({ food_id: food.id, unit_name: 'g', gram_weight: 1, is_default: false });
    servings.push({ food_id: food.id, unit_name: 'gram', gram_weight: 1, is_default: false });
    servings.push({ food_id: food.id, unit_name: 'kg', gram_weight: 1000, is_default: false });

    if (catName === 'dal_lentil' || catName === 'vegetable' || catName === 'non_veg') {
      servings.push({ food_id: food.id, unit_name: 'katori', gram_weight: 150, is_default: true });
      servings.push({ food_id: food.id, unit_name: 'bowl', gram_weight: 150, is_default: false });
      servings.push({ food_id: food.id, unit_name: 'plate', gram_weight: 300, is_default: false });
      servings.push({ food_id: food.id, unit_name: 'tbsp', gram_weight: 15, is_default: false });
    }

    if (catName === 'beverage' || catName === 'dairy') {
      servings.push({ food_id: food.id, unit_name: 'glass', gram_weight: 250, is_default: true });
      servings.push({ food_id: food.id, unit_name: 'cup', gram_weight: 150, is_default: false });
      servings.push({ food_id: food.id, unit_name: 'ml', gram_weight: 1, is_default: false });
    }
  }

  // 2. Specific Item Overrides (Breads, Snacks, Fruits, etc. where "piece" matters)
  
  // Breads (Pieces)
  addServing('chapati', 'piece', 35, true);
  addServing('chapati', 'roti', 35, false);
  addServing('paratha', 'piece', 80, true);
  addServing('aloo paratha', 'piece', 120, true);
  addServing('paneer paratha', 'piece', 120, true);
  addServing('naan', 'piece', 100, true);
  addServing('butter naan', 'piece', 110, true);
  addServing('garlic naan', 'piece', 110, true);
  addServing('puri', 'piece', 25, true);
  addServing('bhatura', 'piece', 80, true);
  addServing('bhakri', 'piece', 60, true);
  addServing('thepla', 'piece', 40, true);
  addServing('rumali roti', 'piece', 60, true);

  // Grains/Rice
  addServing('rice', 'katori', 150, true);
  addServing('rice', 'plate', 300, false);
  addServing('biryani', 'plate', 350, true);
  addServing('veg biryani', 'plate', 350, true);
  addServing('pulao', 'plate', 300, true);
  addServing('poha', 'katori', 100, false);
  addServing('poha', 'plate', 180, true);
  addServing('upma', 'katori', 120, false);
  addServing('upma', 'plate', 200, true);
  addServing('maggi', 'packet', 70, true);
  addServing('hakka noodles', 'plate', 250, true);

  // South Indian
  addServing('dosa', 'piece', 80, true);
  addServing('masala dosa', 'piece', 150, true);
  addServing('idli', 'piece', 40, true);
  addServing('vada', 'piece', 50, true);
  addServing('uttapam', 'piece', 120, true);
  addServing('appam', 'piece', 60, true);

  // Fast Food & Snacks
  addServing('samosa', 'piece', 50, true);
  addServing('pakora', 'piece', 20, true);
  addServing('vada pav', 'piece', 120, true);
  addServing('pani puri', 'plate', 120, true); // ~6 puris
  addServing('bhel puri', 'plate', 150, true);
  addServing('pav bhaji', 'plate', 250, true);
  addServing('kachori', 'piece', 60, true);
  addServing('burger', 'piece', 150, true);
  addServing('veg burger', 'piece', 140, true);
  addServing('mcaloo tikki', 'piece', 142, true);
  addServing('mcveggie', 'piece', 165, true);
  addServing('pizza margherita', 'slice', 80, true);
  addServing('pizza margherita', 'regular', 300, false);
  addServing('french fries', 'medium', 110, true);
  addServing('wrap', 'piece', 200, true);
  addServing('veg momos', 'piece', 25, false);
  addServing('veg momos', 'plate', 150, true); // 6 pieces
  
  // Eggs & Meat
  addServing('egg', 'piece', 50, true);
  addServing('boiled egg', 'piece', 50, true);
  addServing('egg omelette', 'piece', 100, true); // 2 eggs
  addServing('chicken breast', 'piece', 150, true);
  addServing('chicken leg', 'piece', 120, true);
  addServing('chicken tikka', 'piece', 30, false);
  addServing('chicken tikka', 'plate', 180, true); // 6 pieces

  // Dairy, Sweets & Bakery
  addServing('paneer', 'cube', 15, false);
  addServing('paneer', 'packet', 200, false);
  addServing('paneer bhurji', 'katori', 150, true);
  addServing('paneer bhurji', 'plate', 250, false);
  addServing('palak paneer', 'katori', 150, true);
  addServing('palak paneer', 'bowl', 150, false);
  addServing('matar paneer', 'katori', 150, true);
  addServing('matar paneer', 'bowl', 150, false);
  addServing('bread', 'slice', 25, true);
  addServing('brown bread', 'slice', 25, true);
  addServing('gulab jamun', 'piece', 40, true);
  addServing('jalebi', 'piece', 30, true);
  addServing('rasgulla', 'piece', 50, true);
  addServing('ladoo', 'piece', 40, true);
  addServing('barfi', 'piece', 20, true);
  addServing('kaju katli', 'piece', 15, true);
  addServing('rasmalai', 'piece', 60, true);
  
  // Fruits
  addServing('banana', 'piece', 118, true); // USDA medium
  addServing('apple', 'piece', 182, true); // USDA medium
  addServing('mango', 'piece', 200, true); // Indian average
  addServing('orange', 'piece', 131, true);
  addServing('guava', 'piece', 100, true);
  addServing('watermelon', 'slice', 280, true);

  // Nuts & Supplements
  addServing('whey protein', 'scoop', 30, true);
  addServing('plant protein', 'scoop', 35, true);
  addServing('creatine', 'scoop', 5, true);
  addServing('peanuts', 'handful', 28, true); // ~1 oz
  addServing('almonds', 'handful', 28, true);
  addServing('almonds', 'piece', 1.2, false);
  addServing('cashews', 'handful', 28, true);
  addServing('cashews', 'piece', 1.5, false);

  // Condiments
  addServing('green chutney', 'tbsp', 15, true);
  addServing('pickle', 'tbsp', 15, true);
  addServing('papad', 'piece', 15, true);
  addServing('tomato ketchup', 'tbsp', 15, true);
  addServing('mayonnaise', 'tbsp', 15, true);
  
  // Beverages (Overrides)
  addServing('chai', 'cup', 150, true); // Cutting chai / small cup
  addServing('chai', 'glass', 250, false);
  addServing('coffee', 'cup', 150, true);
  addServing('coconut water', 'glass', 250, true);
  addServing('coconut water', 'whole', 400, false);

  // Filter out duplicates (if any) and insert
  const uniqueServings = [];
  const seen = new Set();
  for (const s of servings) {
    const key = `${s.food_id}-${s.unit_name}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueServings.push(s);
    }
  }

  // Insert in batches
  const batchSize = 100;
  for (let i = 0; i < uniqueServings.length; i += batchSize) {
    const batch = uniqueServings.slice(i, i + batchSize);
    await knex('food_servings').insert(batch);
  }

  console.log(`⚖️ Seeded ${uniqueServings.length} serving conversions into nutrition database`);
}
