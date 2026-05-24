require('dotenv').config({path: `${__dirname}/../.env`});

const make_config = require('./make_config');

module.exports = make_config(process.env);
