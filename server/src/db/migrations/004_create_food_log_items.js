/**
 * @param { import("knex").Knex } knex
 */
export async function up(knex) {
  return knex.schema.createTable('food_log_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('food_log_id').references('id').inTable('food_logs').onDelete('CASCADE').notNullable();
    table.string('food_name').notNullable();
    table.string('food_name_hi');
    table.float('quantity').defaultTo(1);
    table.string('unit', 30);
    table.integer('calories').defaultTo(0);
    table.float('protein').defaultTo(0);
    table.float('carbs').defaultTo(0);
    table.float('fat').defaultTo(0);
    table.float('fibre').defaultTo(0);
    table.float('sugar').defaultTo(0);
    table.float('sodium').defaultTo(0);
    table.float('confidence_score').defaultTo(0);
    table.boolean('from_cache').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

/**
 * @param { import("knex").Knex } knex
 */
export async function down(knex) {
  return knex.schema.dropTableIfExists('food_log_items');
}
