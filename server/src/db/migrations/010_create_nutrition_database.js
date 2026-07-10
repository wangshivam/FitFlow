/**
 * Migration: Create Normalized Nutrition Database
 * 
 * Creates 6 tables:
 *   1. food_categories — categorization with icons
 *   2. foods — canonical food entries with per-100g nutrition
 *   3. food_aliases — multi-language aliases & Hinglish spellings
 *   4. food_servings — portion conversion (unit → grams)
 *   5. branded_foods — restaurant & packaged food items
 *   6. meal_portions — default Indian meal templates
 *
 * Also enables pg_trgm extension for fuzzy search and creates GIN indexes.
 */

/**
 * @param { import("knex").Knex } knex
 */
export async function up(knex) {
  // Enable trigram extension for fuzzy matching
  await knex.raw('CREATE EXTENSION IF NOT EXISTS pg_trgm');

  // ── 1. Food Categories ──
  await knex.schema.createTable('food_categories', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 50).unique().notNullable();
    table.string('display_name', 80);
    table.string('display_name_hi', 80);
    table.string('icon', 10);
    table.integer('sort_order').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // ── 2. Foods — Canonical entries with per-100g nutrition ──
  await knex.schema.createTable('foods', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('canonical_name', 150).unique().notNullable();
    table.string('canonical_name_hi', 150);
    table.uuid('category_id').references('id').inTable('food_categories').onDelete('SET NULL');
    table.string('cuisine_type', 30).defaultTo('pan_indian');
    table.boolean('is_veg').defaultTo(true);
    table.float('calories_per_100g').notNullable();
    table.float('protein_per_100g').notNullable();
    table.float('carbs_per_100g').notNullable();
    table.float('fat_per_100g').notNullable();
    table.float('fibre_per_100g').defaultTo(0);
    table.float('sugar_per_100g').defaultTo(0);
    table.float('sodium_per_100g').defaultTo(0);
    table.string('source', 20).notNullable().defaultTo('ifct');
    table.string('source_food_code', 50);
    table.boolean('verified').defaultTo(false);
    table.float('confidence').defaultTo(0.95);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index(['category_id']);
    table.index(['cuisine_type']);
    table.index(['is_veg']);
  });

  // GIN index for trigram fuzzy search on food names
  await knex.raw(`
    CREATE INDEX idx_foods_canonical_name_trgm 
    ON foods USING GIN (canonical_name gin_trgm_ops)
  `);

  // ── 3. Food Aliases — Multi-language lookup ──
  await knex.schema.createTable('food_aliases', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('food_id').references('id').inTable('foods').onDelete('CASCADE').notNullable();
    table.string('alias_name', 150).notNullable();
    table.string('language', 10).defaultTo('en');

    table.unique(['alias_name']);
    table.index(['food_id']);
  });

  // GIN index for trigram fuzzy search on aliases
  await knex.raw(`
    CREATE INDEX idx_food_aliases_alias_name_trgm 
    ON food_aliases USING GIN (alias_name gin_trgm_ops)
  `);

  // ── 4. Food Servings — Portion conversion engine ──
  await knex.schema.createTable('food_servings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('food_id').references('id').inTable('foods').onDelete('CASCADE').notNullable();
    table.string('unit_name', 30).notNullable();
    table.float('gram_weight').notNullable();
    table.boolean('is_default').defaultTo(false);
    table.string('description', 100);

    table.unique(['food_id', 'unit_name']);
    table.index(['food_id']);
  });

  // ── 5. Branded Foods — Restaurant & packaged items ──
  await knex.schema.createTable('branded_foods', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('base_food_id').references('id').inTable('foods').onDelete('SET NULL');
    table.string('brand_name', 100).notNullable();
    table.string('item_name', 200).notNullable();
    table.float('calories_per_serving').notNullable();
    table.float('protein_per_serving').notNullable();
    table.float('carbs_per_serving').notNullable();
    table.float('fat_per_serving').notNullable();
    table.float('serving_size_grams');
    table.string('barcode', 50);
    table.string('source', 20).defaultTo('manual');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['brand_name']);
    table.index(['barcode']);
  });

  // ── 6. Meal Portions — Default Indian meal templates ──
  await knex.schema.createTable('meal_portions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 100).notNullable();
    table.string('name_hi', 100);
    table.text('description');
    table.jsonb('items').notNullable().defaultTo('[]');
    table.integer('total_calories').defaultTo(0);
    table.float('total_protein').defaultTo(0);
    table.float('total_carbs').defaultTo(0);
    table.float('total_fat').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

/**
 * @param { import("knex").Knex } knex
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('meal_portions');
  await knex.schema.dropTableIfExists('branded_foods');
  await knex.schema.dropTableIfExists('food_servings');
  await knex.schema.dropTableIfExists('food_aliases');
  await knex.schema.dropTableIfExists('foods');
  await knex.schema.dropTableIfExists('food_categories');
}
