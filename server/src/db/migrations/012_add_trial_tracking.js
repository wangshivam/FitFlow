/**
 * Migration 012: Add trial tracking to users and update usage limits logic
 *
 * - Adds `trial_ends_at` to users table (30 days from registration)
 * - Adjusts usage_limits max values to reflect trial tier
 *
 * Trial period (first 30 days):
 *   - Unlimited food logs (999/day)
 *   - 3 AI coach messages/day
 *
 * After trial:
 *   - 3 food logs/day (reduced free tier, not 0)
 *   - 3 AI coach messages/day
 *
 * Premium always:
 *   - Unlimited everything
 */

/**
 * @param { import("knex").Knex } knex
 */
export async function up(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.timestamp('trial_ends_at');
  });

  // Backfill existing users: trial_ends_at = created_at + 30 days
  await knex.raw(`
    UPDATE users
    SET trial_ends_at = created_at + INTERVAL '30 days'
    WHERE trial_ends_at IS NULL
  `);

  // Also update existing usage_limits to reflect sensible defaults
  // (coach messages limited to 3, food logs to 999 for trial users)
  await knex.raw(`
    UPDATE usage_limits
    SET 
      food_logs_max = 999,
      coach_messages_max = 3
    WHERE limit_date >= CURRENT_DATE
  `);
}

/**
 * @param { import("knex").Knex } knex
 */
export async function down(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('trial_ends_at');
  });
}
