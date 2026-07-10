/**
 * Migration 014: Create tables for Weekly Summary feature
 *
 * - weight_logs: daily weight tracking entries
 * - weekly_summaries: precomputed/cached weekly aggregates
 */

/**
 * @param { import("knex").Knex } knex
 */
export async function up(knex) {
  // ── weight_logs: per-day weight entries ──
  await knex.schema.createTable('weight_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.date('log_date').notNullable();
    table.float('weight_kg').notNullable();
    table.timestamp('logged_at').defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.unique(['user_id', 'log_date']);
    table.index('user_id');
  });

  // ── weekly_summaries: cached weekly aggregates ──
  await knex.schema.createTable('weekly_summaries', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.date('week_start').notNullable(); // Monday
    table.date('week_end').notNullable();   // Sunday

    // Calories
    table.integer('total_calories').defaultTo(0);
    table.float('avg_calories').defaultTo(0);

    // Macros
    table.float('total_protein').defaultTo(0);
    table.float('total_carbs').defaultTo(0);
    table.float('total_fat').defaultTo(0);

    // Tracking counts
    table.integer('days_tracked').defaultTo(0);
    table.integer('meals_logged').defaultTo(0);
    table.integer('workouts_completed').defaultTo(0);
    table.float('water_total_ml').defaultTo(0);

    // Weight
    table.float('start_weight');
    table.float('end_weight');

    // Streak
    table.integer('streak_count').defaultTo(0);

    // AI (premium)
    table.jsonb('ai_insights').defaultTo('[]');
    table.text('ai_coach_summary');

    // Per-day breakdown (JSON for tables)
    table.jsonb('daily_breakdown').defaultTo('[]');

    // Cache metadata
    table.timestamp('computed_at').defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.unique(['user_id', 'week_start']);
    table.index(['user_id', 'week_start']);
  });
}

/**
 * @param { import("knex").Knex } knex
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('weekly_summaries');
  await knex.schema.dropTableIfExists('weight_logs');
}
