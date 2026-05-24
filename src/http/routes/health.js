const pkg = require('../../../package.json');

const routes = [
    {req: 'GET /health', fn: health_get},
];

// GET /health
async function health_get(req, res)
{
    res.setHeader('x-navplace-version', pkg.version);
    res.type('text').send('OK');
}

module.exports = routes;
