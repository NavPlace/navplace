const random_uid = require('./random_uid');

function random_uid_collection()
{
    return random_uid('col_');
}

module.exports = random_uid_collection;
