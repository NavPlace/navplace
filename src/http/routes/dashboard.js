const routes = [
    {req: 'GET /dashboard', fn: dashboard_get},
];

// GET /dashboard
async function dashboard_get(req, res)
{
    res.send({name: 'dashboard', user: req.user});
}

module.exports = routes;
