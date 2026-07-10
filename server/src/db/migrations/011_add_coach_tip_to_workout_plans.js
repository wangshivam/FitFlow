/**
 * Migration: Add coach_tip to workout_plans and widen rest_reason
 * @param { import("knex").Knex } knex
 */
export async function up(knex) {
  await knex.schema.alterTable('workout_plans', (table) => {
    table.text('coach_tip');
    table.text('rest_reason_text'); // wider version; we'll use this going forward
  });
}

/**
 * @param { import("knex").Knex } knex
 */
export async function down(knex) {
  await knex.schema.alterTable('workout_plans', (table) => {
    table.dropColumn('coach_tip');
    table.dropColumn('rest_reason_text');
  });
}
