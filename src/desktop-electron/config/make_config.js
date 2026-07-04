const fs_path_resolve = require('@vbarbarosh/node-helpers/src/fs_path_resolve');
const make = require('@vbarbarosh/type-helpers');
const is_str = require('@vbarbarosh/type-helpers/src/is_str');

function make_config(settings)
{
    const out = make(settings, {
        config_dir: {type: 'str'},
        user_data_dir: {type: 'str'},
        designs_dir: {type: 'null'},
        settings_file: {type: 'null'},
        readme_file: {type: 'null'},
        socket_file: {type: 'null'},
        personal_access_token: {type: 'str', nullable: true},
        collection_url: {type: 'str', nullable: true},
        events_url: {type: 'str', nullable: true},
    });

    out.designs_dir = fs_path_resolve(__dirname, '../../../designs');
    out.settings_file = fs_path_resolve(out.config_dir, 'settings.yaml');
    out.readme_file = fs_path_resolve(out.config_dir, 'README.md');
    out.socket_file = fs_path_resolve(out.user_data_dir, 'navplace.sock');

    if (is_str(out.events_url)) {
        out.events_url = out.events_url.replace(/^http:\/\//, 'ws://').replace(/^https:\/\//, 'wss://');
    }

    return out;
}

module.exports = make_config;
