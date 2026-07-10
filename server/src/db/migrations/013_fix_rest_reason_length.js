/**
 * @param { import("knex").Knex } knex
 */
export async function up(knex) {
  return knex.schema.alterTable('workout_plans', (table) => {
    // rest_reason was varchar(30), too short for AI-generated reasons
    table.string('rest_reason', 255).alter();
  });
}

/**
 * @param { import("knex").Knex } knex
 */
export async function down(knex) {
  return knex.schema.alterTable('workout_plans', (table) => {
    table.string('rest_reason', 30).alter();
  });
}
