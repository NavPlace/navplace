const fs_path_resolve = require('@vbarbarosh/node-helpers/src/fs_path_resolve');
const routes = [
    {req: 'GET /', fn: landing_get},
    {req: 'GET /index.html', fn: landing_get},
];

// GET /
// GET /index.html
async function landing_get(req, res)
{
    // res.sendFile(fs_path_resolve(`${__dirname}/../../../www/index.html`));
    res.send({
        s: 'hello',
        user: req.user,
    });
}

module.exports = routes;
