const fs_path_resolve = require('@vbarbarosh/node-helpers/src/fs_path_resolve');
const routes = [
    {req: 'GET /', fn: landing_get},
    {req: 'GET /index.html', fn: landing_get},
    {req: 'GET /collections', fn: collections_get},
    {req: 'GET /collections.html', fn: collections_get},
];

// GET /
// GET /index.html
async function landing_get(req, res)
{
    res.sendFile(fs_path_resolve(`${__dirname}/../../../www/index.html`));
}

// GET /collections
// GET /collections.html
async function collections_get(req, res)
{
    res.sendFile(fs_path_resolve(`${__dirname}/../../../www/collections.html`));
}

module.exports = routes;
