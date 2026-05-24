const db = require('../../../db');
const random_uid_user = require('../helpers/random/random_uid_user');
const random_slug = require('../helpers/random/random_slug');

async function user_create({authwall_user_uid})
{
    const now = new Date();
    const uid = random_uid_user();
    const slug = random_slug();
    await db('users').insert({uid, slug, authwall_user_uid, created_at: now, updated_at: now});
    return await db('users').where({uid}).first();
}

module.exports = user_create;
