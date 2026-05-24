const config = require('./config');

// int8 → JS number
//
// console.log(await db('users').count());
// [ { count: '3' } ] → [ { count: 3 } ]
if (config.db.name === 'postgres') {
    const pg = require('pg');
    pg.types.setTypeParser(20, v => Number(v));
}

const envs = {

    sqlite: {
        client: 'better-sqlite3',
        connection: {
            filename: `${__dirname}/data/db.sqlite3`
        },
        useNullAsDefault: true,
        migrations: {
            directory: `${__dirname}/db/migrations`,
            tableName: 'knex_migrations'
        },
        seeds: {
            directory: `${__dirname}/db/seeds`,
        },
        custom: {
            name: 'sqlite',
            label: 'SQLite 3',
        },
    },

    mysql: {
        client: 'mysql2',
        connection: Object.assign(Object.create({collate: 'utf8mb4_unicode_ci'}), {
            uri: config.db.uri,
            charset: 'utf8mb4',
            timezone: 'Z',
        }),
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            directory: `${__dirname}/db/migrations`,
            tableName: 'knex_migrations'
        },
        seeds: {
            directory: `${__dirname}/db/seeds`,
        },
        custom: {
            name: 'mysql',
            label: 'MySQL',
        },
    },

    postgres: {
        client: 'pg',
        connection: config.db.uri,
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            directory: `${__dirname}/db/migrations`,
            tableName: 'knex_migrations'
        },
        seeds: {
            directory: `${__dirname}/db/seeds`,
        },
        custom: {
            name: 'postgres',
            label: 'PostgreSQL',
        },
    },

};

module.exports = envs[config.db.name];
