/**
 * @param { import("knex").Knex } knex
 */
export async function up(knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  return knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('email').unique().notNullable();
    table.string('password_hash');
    table.string('google_id');
    table.string('name').notNullable();
    table.string('avatar_url');
    table.string('language', 5).defaultTo('en');
    table.string('tier', 20).defaultTo('free');
    table.integer('streak_days').defaultTo(0);
    table.date('last_active_date');
    table.timestamps(true, true);
  });
}

/**
 * @param { import("knex").Knex } knex
 */
export async function down(knex) {
  return knex.schema.dropTableIfExists('users');
}
