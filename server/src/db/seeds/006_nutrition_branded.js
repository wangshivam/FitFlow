/**
 * Seed: Branded Foods — Popular QSR chains and supplement brands in India.
 * Provides exact macros per serving (not per 100g, but per item/scoop).
 */

/**
 * @param { import("knex").Knex } knex
 */
export async function seed(knex) {
  await knex('branded_foods').del();

  const foods = await knex('foods').select('id', 'canonical_name');
  const foodMap = Object.fromEntries(foods.map((f) => [f.canonical_name, f.id]));

  const branded = [
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // McDonald's India
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    { brand: 'McDonalds', item: 'McAloo Tikki Burger', base: 'mcaloo tikki', cal: 339, pro: 8.5, carb: 53.6, fat: 9.8, size: 142 },
    { brand: 'McDonalds', item: 'McVeggie Burger', base: 'mcveggie', cal: 402, pro: 10.2, carb: 57.0, fat: 14.5, size: 165 },
    { brand: 'McDonalds', item: 'McSpicy Paneer Burger', base: 'burger', cal: 652, pro: 16.5, carb: 68.0, fat: 34.5, size: 199 },
    { brand: 'McDonalds', item: 'Chicken Maharaja Mac', base: 'chicken maharaja mac', cal: 832, pro: 34.0, carb: 68.0, fat: 47.0, size: 285 },
    { brand: 'McDonalds', item: 'McChicken Burger', base: 'mcchicken', cal: 400, pro: 14.2, carb: 42.1, fat: 19.3, size: 173 },
    { brand: 'McDonalds', item: 'Fries (Medium)', base: 'french fries', cal: 318, pro: 3.4, carb: 42.0, fat: 15.0, size: 114 },
    { brand: 'McDonalds', item: 'Piri Piri Fries', base: 'french fries', cal: 340, pro: 4.0, carb: 45.0, fat: 16.0, size: 120 },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Domino's Pizza India
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    { brand: 'Dominos', item: 'Margherita Pizza (Regular)', base: 'pizza margherita', cal: 520, pro: 20.0, carb: 65.0, fat: 18.0, size: 200 },
    { brand: 'Dominos', item: 'Peppy Paneer Pizza (Regular)', base: 'peppy paneer pizza', cal: 640, pro: 25.0, carb: 70.0, fat: 28.0, size: 230 },
    { brand: 'Dominos', item: 'Farmhouse Pizza (Regular)', base: 'pizza farmhouse', cal: 580, pro: 22.0, carb: 68.0, fat: 24.0, size: 240 },
    { brand: 'Dominos', item: 'Garlic Breadsticks', base: 'garlic bread', cal: 380, pro: 10.0, carb: 55.0, fat: 14.0, size: 130 },
    { brand: 'Dominos', item: 'Cheese Jalapeno Dip', base: 'mayonnaise', cal: 120, pro: 1.0, carb: 2.0, fat: 12.0, size: 25 },
    { brand: 'Dominos', item: 'Choco Lava Cake', base: null, cal: 350, pro: 5.0, carb: 40.0, fat: 18.0, size: 85 },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // KFC India
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    { brand: 'KFC', item: 'Hot & Crispy Chicken (1 pc)', base: 'kfc hot crispy chicken', cal: 280, pro: 18.0, carb: 15.0, fat: 17.0, size: 110 },
    { brand: 'KFC', item: 'Chicken Zinger Burger', base: 'kfc zinger burger', cal: 450, pro: 20.0, carb: 45.0, fat: 21.0, size: 180 },
    { brand: 'KFC', item: 'Popcorn Chicken (Medium)', base: 'kfc popcorn chicken', cal: 320, pro: 15.0, carb: 25.0, fat: 18.0, size: 115 },
    { brand: 'KFC', item: 'Veg Zinger Burger', base: 'veg burger', cal: 420, pro: 12.0, carb: 55.0, fat: 16.0, size: 175 },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Subway India
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    { brand: 'Subway', item: 'Veggie Delite (6 inch)', base: 'subway veggie delight', cal: 230, pro: 9.0, carb: 42.0, fat: 3.5, size: 164 },
    { brand: 'Subway', item: 'Paneer Tikka (6 inch)', base: null, cal: 450, pro: 22.0, carb: 50.0, fat: 18.0, size: 230 },
    { brand: 'Subway', item: 'Chicken Teriyaki (6 inch)', base: 'subway chicken teriyaki', cal: 320, pro: 25.0, carb: 45.0, fat: 5.0, size: 220 },
    { brand: 'Subway', item: 'Roasted Chicken (6 inch)', base: null, cal: 310, pro: 23.0, carb: 44.0, fat: 5.5, size: 210 },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Haldiram's (Packaged Snacks)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    { brand: 'Haldirams', item: 'Aloo Bhujia', base: 'bhujia', cal: 580, pro: 11.0, carb: 42.0, fat: 42.0, size: 100 },
    { brand: 'Haldirams', item: 'Navrattan Mixture', base: 'mixture', cal: 560, pro: 14.0, carb: 45.0, fat: 38.0, size: 100 },
    { brand: 'Haldirams', item: 'Moong Dal', base: 'namkeen', cal: 450, pro: 24.0, carb: 52.0, fat: 16.0, size: 100 },
    { brand: 'Haldirams', item: 'Diet Mixture', base: 'mixture', cal: 480, pro: 12.0, carb: 65.0, fat: 18.0, size: 100 },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Supplements (Optimum Nutrition, MuscleBlaze, etc.)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    { brand: 'Optimum Nutrition', item: 'Gold Standard 100% Whey', base: 'whey protein', cal: 120, pro: 24.0, carb: 3.0, fat: 1.5, size: 31 },
    { brand: 'MuscleBlaze', item: 'Biozyme Performance Whey', base: 'whey protein', cal: 130, pro: 25.0, carb: 4.0, fat: 2.0, size: 36 },
    { brand: 'MyProtein', item: 'Impact Whey Protein', base: 'whey protein', cal: 103, pro: 21.0, carb: 1.0, fat: 1.9, size: 25 },
    { brand: 'MuscleBlaze', item: 'Peanut Butter (Unsweetened)', base: 'peanut butter', cal: 204, pro: 10.0, carb: 6.0, fat: 16.0, size: 32 },
    { brand: 'AsItIs', item: 'Atom Whey Protein', base: 'whey protein', cal: 119, pro: 27.0, carb: 2.0, fat: 0.5, size: 33 },
    { brand: 'Fast&Up', item: 'Plant Protein', base: 'plant protein', cal: 145, pro: 30.0, carb: 3.0, fat: 1.5, size: 45 },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Packaged Foods (Maggi, Amul, Britannia)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    { brand: 'Maggi', item: '2-Minute Noodles (Masala)', base: 'maggi', cal: 314, pro: 7.2, carb: 45.4, fat: 11.5, size: 70 },
    { brand: 'Amul', item: 'Butter', base: 'butter', cal: 722, pro: 0.5, carb: 0, fat: 80.0, size: 100 },
    { brand: 'Amul', item: 'Cheese Slices', base: 'cheese', cal: 63, pro: 4.0, carb: 0.3, fat: 5.0, size: 20 },
    { brand: 'Amul', item: 'Masti Buttermilk', base: 'buttermilk', cal: 60, pro: 3.0, carb: 4.5, fat: 3.0, size: 200 },
    { brand: 'Britannia', item: 'Marie Gold', base: 'marie gold', cal: 432, pro: 7.5, carb: 76.5, fat: 10.6, size: 100 },
    { brand: 'Parle', item: 'Parle-G', base: 'biscuit', cal: 451, pro: 6.5, carb: 73.6, fat: 14.5, size: 100 },
  ];

  const toInsert = branded.map((b) => ({
    brand_name: b.brand,
    item_name: b.item,
    base_food_id: b.base ? foodMap[b.base] || null : null,
    calories_per_serving: b.cal,
    protein_per_serving: b.pro,
    carbs_per_serving: b.carb,
    fat_per_serving: b.fat,
    serving_size_grams: b.size,
  }));

  await knex('branded_foods').insert(toInsert);

  console.log(`🍟 Seeded ${toInsert.length} branded foods into nutrition database`);
}
