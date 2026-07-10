/**
 * @param { import("knex").Knex } knex
 */
export async function up(knex) {
  await knex.schema.createTable('subscriptions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.string('plan', 30).defaultTo('free');
    table.string('status', 20).defaultTo('active');
    table.string('razorpay_subscription_id');
    table.string('razorpay_payment_id');
    table.integer('amount_paise');
    table.timestamp('starts_at');
    table.timestamp('expires_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index('user_id');
  });

  await knex.schema.createTable('daily_summaries', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.date('summary_date').notNullable();
    table.integer('total_calories_consumed').defaultTo(0);
    table.integer('total_calories_burned').defaultTo(0);
    table.float('total_protein').defaultTo(0);
    table.float('total_carbs').defaultTo(0);
    table.float('total_fat').defaultTo(0);
    table.float('water_ml').defaultTo(0);
    table.boolean('workout_completed').defaultTo(false);
    table.string('workout_feedback', 20);
    table.integer('meals_logged').defaultTo(0);
    table.float('adherence_score').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.unique(['user_id', 'summary_date']);
  });

  return knex.schema.createTable('usage_limits', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.date('limit_date').notNullable();
    table.integer('food_logs_used').defaultTo(0);
    table.integer('coach_messages_used').defaultTo(0);
    table.integer('food_logs_max').defaultTo(5);
    table.integer('coach_messages_max').defaultTo(10);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.unique(['user_id', 'limit_date']);
  });
}

/**
 * @param { import("knex").Knex } knex
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('usage_limits');
  await knex.schema.dropTableIfExists('daily_summaries');
  return knex.schema.dropTableIfExists('subscriptions');
}
