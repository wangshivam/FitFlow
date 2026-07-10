/**
 * @param { import("knex").Knex } knex
 */
export async function up(knex) {
  return knex.schema.createTable('indian_food_cache', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('food_name').unique().notNullable();
    table.string('food_name_hi');
    table.jsonb('aliases').defaultTo('[]');
    table.string('default_unit', 30);
    table.float('default_quantity').defaultTo(1);
    table.integer('calories_per_serving').notNullable();
    table.float('protein_per_serving').defaultTo(0);
    table.float('carbs_per_serving').defaultTo(0);
    table.float('fat_per_serving').defaultTo(0);
    table.float('fibre_per_serving').defaultTo(0);
    table.float('sugar_per_serving').defaultTo(0);
    table.float('sodium_per_serving').defaultTo(0);
    table.string('category', 30);
    table.boolean('is_veg').defaultTo(true);
    table.float('confidence').defaultTo(0.95);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

/**
 * @param { import("knex").Knex } knex
 */
export async function down(knex) {
  return knex.schema.dropTableIfExists('indian_food_cache');
}
