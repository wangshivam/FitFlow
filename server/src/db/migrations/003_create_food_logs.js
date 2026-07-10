/**
 * @param { import("knex").Knex } knex
 */
export async function up(knex) {
  return knex.schema.createTable('food_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.date('log_date').notNullable();
    table.string('meal_slot', 30).notNullable();
    table.text('raw_input');
    table.integer('total_calories').defaultTo(0);
    table.float('total_protein').defaultTo(0);
    table.float('total_carbs').defaultTo(0);
    table.float('total_fat').defaultTo(0);
    table.float('total_fibre').defaultTo(0);
    table.float('total_sugar').defaultTo(0);
    table.float('total_sodium').defaultTo(0);
    table.boolean('is_cached').defaultTo(false);
    table.boolean('user_edited').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index(['user_id', 'log_date']);
  });
}

/**
 * @param { import("knex").Knex } knex
 */
export async function down(knex) {
  return knex.schema.dropTableIfExists('food_logs');
}
