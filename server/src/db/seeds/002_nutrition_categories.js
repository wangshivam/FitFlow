/**
 * Seed: Food Categories
 * 14 categories covering all Indian food types
 */

const { v4: uuidv4 } = await import('uuid');

/**
 * @param { import("knex").Knex } knex
 */
export async function seed(knex) {
  await knex('food_categories').del();

  const categories = [
    { id: uuidv4(), name: 'grain', display_name: 'Grains & Breads', display_name_hi: 'अनाज और रोटी', icon: '🌾', sort_order: 1 },
    { id: uuidv4(), name: 'dal_lentil', display_name: 'Dal & Lentils', display_name_hi: 'दाल और दलहन', icon: '🫘', sort_order: 2 },
    { id: uuidv4(), name: 'dairy', display_name: 'Dairy & Paneer', display_name_hi: 'दूध और पनीर', icon: '🧀', sort_order: 3 },
    { id: uuidv4(), name: 'non_veg', display_name: 'Non-Veg & Eggs', display_name_hi: 'मांस और अंडा', icon: '🍗', sort_order: 4 },
    { id: uuidv4(), name: 'vegetable', display_name: 'Vegetables & Sabzi', display_name_hi: 'सब्जियां', icon: '🥬', sort_order: 5 },
    { id: uuidv4(), name: 'fruit', display_name: 'Fruits', display_name_hi: 'फल', icon: '🍎', sort_order: 6 },
    { id: uuidv4(), name: 'beverage', display_name: 'Beverages', display_name_hi: 'पेय', icon: '☕', sort_order: 7 },
    { id: uuidv4(), name: 'street_food', display_name: 'Street Food', display_name_hi: 'स्ट्रीट फूड', icon: '🍟', sort_order: 8 },
    { id: uuidv4(), name: 'sweet', display_name: 'Sweets & Desserts', display_name_hi: 'मिठाई', icon: '🍮', sort_order: 9 },
    { id: uuidv4(), name: 'snack', display_name: 'Snacks & Namkeen', display_name_hi: 'नमकीन और स्नैक्स', icon: '🥜', sort_order: 10 },
    { id: uuidv4(), name: 'supplement', display_name: 'Supplements & Protein', display_name_hi: 'सप्लीमेंट', icon: '💪', sort_order: 11 },
    { id: uuidv4(), name: 'condiment', display_name: 'Condiments & Chutneys', display_name_hi: 'चटनी और अचार', icon: '🫙', sort_order: 12 },
    { id: uuidv4(), name: 'fast_food', display_name: 'Fast Food & Restaurant', display_name_hi: 'रेस्टोरेंट फूड', icon: '🍔', sort_order: 13 },
    { id: uuidv4(), name: 'fasting', display_name: 'Fasting / Vrat Foods', display_name_hi: 'व्रत का खाना', icon: '🙏', sort_order: 14 },
  ];

  return knex('food_categories').insert(categories);
}
