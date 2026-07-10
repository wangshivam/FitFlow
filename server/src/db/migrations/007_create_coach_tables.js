/**
 * @param { import("knex").Knex } knex
 */
export async function up(knex) {
  await knex.schema.createTable('coach_conversations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.string('title');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    table.index('user_id');
  });

  return knex.schema.createTable('coach_messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('conversation_id').references('id').inTable('coach_conversations').onDelete('CASCADE').notNullable();
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable();
    table.string('role', 20).notNullable();
    table.text('content').notNullable();
    table.jsonb('context_snapshot');
    table.integer('token_count').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index('conversation_id');
  });
}

/**
 * @param { import("knex").Knex } knex
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('coach_messages');
  return knex.schema.dropTableIfExists('coach_conversations');
}
