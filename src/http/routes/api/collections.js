const const_event = require('../../helpers/const/const_event');
const db = require('../../../../db');
const random_slug = require('../../helpers/random/random_slug');
const random_uid_collection = require('../../helpers/random/random_uid_collection');
const {notify} = require('../../services/events');

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

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
    const user = require_user(req);
    const {limit, offset} = parse_paging(req.query);

    const [{count}] = await db('collections').where({user_id: user.id}).count({count: '*'});
    const total = Number(count);

    const items = await db('collections')
        .where({user_id: user.id})
        .orderBy('updated_at', 'desc')
        .limit(limit)
        .offset(offset)
        .select('uid', 'label', 'created_at', 'updated_at');

    res.send({items: items.map(serialize_summary), total, limit, offset});
}

// GET /api/v1/collections/:collection_uid
async function collections_fetch(req, res)
{
    const user = require_user(req);
    const collection = await find_collection(user, req.params.collection_uid);
    res.send(serialize_collection(collection));
}

// POST /api/v1/collections
async function collections_post(req, res)
{
    const user = require_user(req);
    const now = new Date();
    const uid = random_uid_collection();
    const slug = random_slug();
    const contents = typeof req.body?.contents === 'string' ? req.body.contents : sample_contents();
    const label = normalize_label(req.body?.label) || 'Untitled collection';

    await db('collections').insert({
        uid,
        slug,
        user_id: user.id,
        label,
        contents,
        created_at: now,
        updated_at: now,
    });

    const collection = await db('collections').where({uid}).first();
    notify(user.uid, const_event.collection_created, serialize_summary(collection));
    res.status(201).send(serialize_collection(collection));
}

// PATCH /api/v1/collections/:collection_uid
async function collections_patch(req, res)
{
    const user = require_user(req);
    const collection = await find_collection(user, req.params.collection_uid);
    const patch = {};

    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'label')) {
        const label = normalize_label(req.body.label);
        if (!label) {
            throw new Error('Label is required');
        }
        patch.label = label;
    }

    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'contents')) {
        if (typeof req.body.contents !== 'string') {
            throw new Error('Contents must be a string');
        }
        patch.contents = req.body.contents;
    }

    if (!Object.keys(patch).length) {
        throw new Error('Nothing to update');
    }

    patch.updated_at = new Date();
    await db('collections').where({id: collection.id, user_id: user.id}).update(patch);

    const updated = await db('collections').where({id: collection.id}).first();
    notify(user.uid, const_event.collection_updated, serialize_summary(updated));
    res.send(serialize_collection(updated));
}

// DELETE /api/v1/collections/:collection_uid
async function collections_delete(req, res)
{
    const user = require_user(req);
    const collection = await find_collection(user, req.params.collection_uid);
    await db('collections').where({id: collection.id, user_id: user.id}).delete();
    notify(user.uid, const_event.collection_deleted, {uid: collection.uid, label: collection.label});
    res.status(204).end();
}

function require_user(req)
{
    if (!req.user) {
        const error = new Error('Authentication is required');
        error.status_code = 401;
        throw error;
    }
    return req.user;
}

async function find_collection(user, uid)
{
    const collection = await db('collections').where({uid, user_id: user.id}).first();
    if (!collection) {
        const error = new Error('Collection not found');
        error.status_code = 404;
        throw error;
    }
    return collection;
}

function parse_paging(query)
{
    const raw_limit = Number.parseInt(query?.limit, 10);
    const raw_offset = Number.parseInt(query?.offset, 10);
    const limit = Number.isFinite(raw_limit) ? Math.min(Math.max(raw_limit, 1), MAX_LIMIT) : DEFAULT_LIMIT;
    const offset = Number.isFinite(raw_offset) && raw_offset > 0 ? raw_offset : 0;
    return {limit, offset};
}

function serialize_collection(collection)
{
    return {
        uid: collection.uid,
        label: collection.label,
        contents: collection.contents,
        created_at: to_iso(collection.created_at),
        updated_at: to_iso(collection.updated_at),
    };
}

function serialize_summary(collection)
{
    return {
        uid: collection.uid,
        label: collection.label,
        created_at: to_iso(collection.created_at),
        updated_at: to_iso(collection.updated_at),
    };
}

function to_iso(value)
{
    if (!value) {
        return null;
    }
    if (value instanceof Date) {
        return value.toISOString();
    }
    return new Date(value).toISOString();
}

function normalize_label(value)
{
    return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, 255) : '';
}

function sample_contents()
{
    return `% design: basic
% title: New Collection

# Useful
NavPlace https://navplace.com
GitHub   https://github.com
`;
}

module.exports = routes;
