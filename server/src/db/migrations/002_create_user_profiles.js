/**
 * @param { import("knex").Knex } knex
 */
export async function up(knex) {
  return knex.schema.createTable('user_profiles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').unique().notNullable();
    table.integer('age');
    table.string('gender', 10);
    table.float('height_cm');
    table.float('weight_kg');
    table.float('target_weight_kg');
    table.string('goal', 30);
    table.string('activity_level', 20);
    table.string('workout_preference', 20);
    table.string('equipment', 20);
    table.jsonb('health_conditions').defaultTo('[]');
    table.string('diet_type', 20);
    table.string('city', 100);
    table.string('state', 100);
    table.integer('daily_calorie_target');
    table.integer('daily_protein_target');
    table.integer('daily_carb_target');
    table.integer('daily_fat_target');
    table.float('tdee');
    table.float('bmr');
    table.boolean('onboarding_complete').defaultTo(false);
    table.timestamps(true, true);
  });
}

/**
 * @param { import("knex").Knex } knex
 */
export async function down(knex) {
  return knex.schema.dropTableIfExists('user_profiles');
}
