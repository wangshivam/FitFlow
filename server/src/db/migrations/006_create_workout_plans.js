/**
 * @param { import("knex").Knex } knex
 */
export async function up(knex) {
  return knex.schema.createTable('workout_plans', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.date('plan_date').notNullable();
    table.string('status', 20).defaultTo('pending');
    table.string('difficulty', 20).defaultTo('moderate');
    table.jsonb('warm_up').defaultTo('[]');
    table.jsonb('workout').defaultTo('[]');
    table.jsonb('cool_down').defaultTo('[]');
    table.integer('estimated_duration_min');
    table.integer('estimated_calories_burn');
    table.string('feedback', 20);
    table.text('feedback_notes');
    table.jsonb('completed_exercises').defaultTo('[]');
    table.boolean('is_rest_day').defaultTo(false);
    table.string('rest_reason', 30);
    table.timestamps(true, true);
    table.unique(['user_id', 'plan_date']);
  });
}

/**
 * @param { import("knex").Knex } knex
 */
export async function down(knex) {
  return knex.schema.dropTableIfExists('workout_plans');
}
