const routes = [
    {req: 'GET /api/v1/collections', fn: collections_list},
    {req: 'GET /api/v1/collections/:collection_uid', fn: collections_fetch},
    {req: 'POST /api/v1/collections', fn: collections_post},
    {req: 'PATCH /api/v1/collections/:collection_uid', fn: collections_patch},
    {req: 'DELETE /api/v1/collections/:collection_uid', fn: collections_delete},
];

// GET /api/v1/collections
async function collections_list(req, res)
{
}

// GET /api/v1/collections/:collection_uid
async function collections_fetch(req, res)
{
}

// POST /api/v1/collections
async function collections_post(req, res)
{
}

// PATCH /api/v1/collections/:collection_uid
async function collections_patch(req, res)
{
}

// DELETE /api/v1/collections/:collection_uid
async function collections_delete(req, res)
{
}

module.exports = routes;
