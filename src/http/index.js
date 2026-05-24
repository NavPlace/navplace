#!/usr/bin/env node

// util._extend used in http-proxy (transitive dep of http-proxy-middleware) — cannot be fixed upstream
//
// node_modules/http-proxy$ g _extend
// lib/http-proxy/index.js
// 2:    extend    = require('util')._extend,
//
// lib/http-proxy/common.js
// 3:    extend   = require('util')._extend,
process.removeAllListeners('warning');
process.on('warning', function (event) {
    if (event.code === 'DEP0060') {
        return;
    }
    process.stderr.write(event.stack + '\n');
});

// ⚠️ Sentry must initialize before `require('express')`
const config = require('../../config');
require('./services/sentry').init_sentry(config);

const als = require('./helpers/als');
const bootstrap_database = require('./helpers/bootstrap_database');
const cli = require('@vbarbarosh/node-helpers/src/cli');
const create_app = require('./create_app');
const express_run = require('./helpers/express/express_run');
const knex = require('knex');
const knexfile = require('../../knexfile');
const make_logger_daily = require('./services/logger/make_logger_daily');
const make_logger_stdout = require('./services/logger/make_logger_stdout');
const pkg = require('../../package.json');
// const render_config_summary = require('./helpers/render/render_config_summary');

cli(main);

async function main()
{
    const db = knex(knexfile);
    await using _ = {[Symbol.asyncDispose]: () => db.destroy()};

    await using logger = make_logger();

    logger.write(`[navplace_started] v${pkg.version}`);
    // for (const line of render_config_summary(config)) {
    //     logger.write(line);
    // }

    await als.run({db, logger}, async function () {
        await bootstrap_database();
        const app = await create_app();
        await express_run(app, config.port, config.listen);
    });
}

function make_logger()
{
    if (config.logger === 'stdout') {
        return make_logger_stdout();
    }
    return make_logger_daily();
}
