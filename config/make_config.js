const make = require('@vbarbarosh/type-helpers');

function make_config(env)
{
    env.NAVPLACE_DB ??= '';

    const out = {
        port: make(process.env.PORT, {type: 'int', default: 3000}),
        listen: make(process.env.LISTEN, {type: 'str', default: '127.0.0.1'}),
        logger: make(process.env.LOGGER, {type: 'enum', options: ['stdout', 'daily']}),
        db: {
            name: 'sqlite',
            uri: env.NAVPLACE_DB,
        },
        sentry: {
            enabled: false,
        },
    };

    if (env.NAVPLACE_DB.startsWith('mysql://')) {
        out.db.name = 'mysql';
    }
    else {
        throw new Error(`Invalid database: ${env.NAVPLACE_DB}`);
    }

    return out;
}

module.exports = make_config;
