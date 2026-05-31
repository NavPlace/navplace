const fs = require('fs');
const fs_path_resolve = require('@vbarbarosh/node-helpers/src/fs_path_resolve');
const make_config = require('./make_config');
const os = require('os');
const yaml = require('yaml');

function init()
{
    const config_dir = fs_path_resolve(os.homedir(), '.navplace');
    const user_data_dir = fs_path_resolve(process.env.XDG_CONFIG_HOME || fs_path_resolve(os.homedir(), '.config'), 'navplace');

    let settings = {};
    try {
        const utf8 = fs.readFileSync(fs_path_resolve(config_dir, 'settings.yaml'), {encoding: 'utf8'});
        const obj = yaml.parse(utf8);
        Object.assign(settings, obj);
    }
    catch (error) {
    }

    settings.config_dir = config_dir;
    settings.user_data_dir = user_data_dir;
    return make_config(settings);
}

module.exports = init();
