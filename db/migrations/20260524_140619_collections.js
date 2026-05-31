const utf8mb4_bin = require('../utf8mb4_bin');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    await knex.schema.createTable('collections', function (table) {
        table.increments('id');

        utf8mb4_bin(table.string('uid', 32).notNullable());
        utf8mb4_bin(table.string('slug', 64).notNullable());

        table.integer('user_id').unsigned().notNullable();

        table.string('label', 255).notNullable();
        table.text('contents').notNullable();

        table.datetime('created_at').notNullable();
        table.datetime('updated_at').notNullable();

        table.unique(['uid']);
        table.unique(['slug']);
        table.index(['user_id']);

        table.foreign('user_id').references('id').inTable('users').onDelete('RESTRICT');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    await knex.schema.dropTable('collections');
};
