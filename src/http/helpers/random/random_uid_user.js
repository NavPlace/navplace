const random_uid = require('./random_uid');

function random_uid_user()
{
    return random_uid('user_');
}

module.exports = random_uid_user;
