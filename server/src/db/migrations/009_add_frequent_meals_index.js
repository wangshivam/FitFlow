/**
 * @param { import("knex").Knex } knex
 */
export async function up(knex) {
  return knex.schema.alterTable('food_logs', (table) => {
    table.index(['user_id', 'raw_input'], 'idx_food_logs_user_raw_input');
  });
}

/**
 * @param { import("knex").Knex } knex
 */
export async function down(knex) {
  return knex.schema.alterTable('food_logs', (table) => {
    table.dropIndex(['user_id', 'raw_input'], 'idx_food_logs_user_raw_input');
  });
}
