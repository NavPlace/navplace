const config = require('../config');
const fs = require('fs');
const fs_exists = require('@vbarbarosh/node-helpers/src/fs_exists');
const fs_mkdirp = require('@vbarbarosh/node-helpers/src/fs_mkdirp');
const fs_path_dirname = require('@vbarbarosh/node-helpers/src/fs_path_dirname');
const fs_path_join = require('@vbarbarosh/node-helpers/src/fs_path_join');
const fs_path_resolve = require('@vbarbarosh/node-helpers/src/fs_path_resolve');
const fs_read = require('@vbarbarosh/node-helpers/src/fs_read');
const fs_write = require('@vbarbarosh/node-helpers/src/fs_write');
const os = require('os');
const shell_spawn = require('@vbarbarosh/node-helpers/src/shell_spawn');

// Install the GNOME hotkey for the AppImage build, invoked as
// `NavPlace.AppImage --configure-gnome`.
//
// The launcher must live on disk OUTSIDE the bundle: the whole point of the
// socket architecture is that summoning the app never mounts/boots the AppImage.
// So we extract the (dependency-free) launcher next to the socket and bind the
// hotkey to it; the .desktop's Exec points back at the AppImage for cold start.
//
// Returns {launcher_file, appimage, node_bin}; the caller reports success.
async function configure_gnome()
{
    const appimage = process.env.APPIMAGE;
    if (!appimage) {
        throw new Error('--configure-gnome must be run from the AppImage (APPIMAGE is not set)');
    }

    // The hotkey fires the extracted launcher via its `env node` shebang, so node
    // must be resolvable on PATH — check before writing anything, fail fast if not.
    const node_bin = await node_on_path();
    if (!node_bin) {
        throw new Error('node was not found in PATH — the hotkey launcher needs Node.js. Install it (or add it to PATH) and run --configure-gnome again.');
    }

    const data_home = process.env.XDG_DATA_HOME || fs_path_join(os.homedir(), '.local', 'share');
    const launcher_file = fs_path_join(config.user_data_dir, 'launcher.js');
    const desktop_file = fs_path_join(data_home, 'applications', 'navplace.desktop');

    await fs_mkdirp(config.user_data_dir);

    // 1. extract the dependency-free launcher (read+write works across the asar boundary)
    await fs_write(launcher_file, await fs_read(fs_path_resolve(__dirname, '../launcher.js')));
    await fs.promises.chmod(launcher_file, 0o755);

    // 2. extract the app icon (best-effort; the AppImage runtime exposes APPDIR)
    const icon = await extract_icon();

    // 3. register the hotkey -> the extracted launcher
    await register_keybinding(launcher_file);

    // 4. .desktop -> the AppImage; `gtk-launch navplace` (the launcher's cold path) lands here
    await fs_mkdirp(fs_path_dirname(desktop_file));
    await fs_write(desktop_file, [
        '[Desktop Entry]',
        'Type=Application',
        'Name=NavPlace',
        'Comment=The fastest way to open your links',
        `Icon=${icon}`,
        `Exec=${appimage}`,
        'Categories=Utility;',
        'StartupWMClass=NavPlace',
        '',
    ].join('\n'));

    return {launcher_file, appimage, node_bin};
}

async function extract_icon()
{
    const appdir = process.env.APPDIR;
    if (appdir) {
        for (const name of ['navplace.png', '.DirIcon']) {
            const src = fs_path_join(appdir, name);
            if (await fs_exists(src)) {
                const dst = fs_path_join(config.user_data_dir, 'navplace.png');
                await fs_write(dst, await fs_read(src));
                return dst;
            }
        }
    }
    return 'application-x-executable';
}

async function node_on_path()
{
    try {
        await run(['node', '--version']);
        return 'node';
    }
    catch {
        return null;
    }
}

async function register_keybinding(launcher_file)
{
    const base = '/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings';
    const slot = `${base}/navplace/`;

    const raw = (await run(['dconf', 'read', base])).trim().replace(/^@as\s+/, '');
    const items = raw ? JSON.parse(raw.replaceAll("'", '"')) : [];
    if (!items.includes(slot)) {
        items.push(slot);
        await run(['dconf', 'write', base, JSON.stringify(items).replaceAll('"', "'")]);
    }

    await run(['dconf', 'load', '/'], [
        '[org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/navplace]',
        "binding='<Ctrl><Shift><Alt>N'",
        `command='${launcher_file}'`,
        "name='navplace'",
        '',
    ].join('\n'));
}

async function run(args, input)
{
    const proc = shell_spawn(args, {stdio: ['pipe', 'pipe', 'pipe']});
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', chunk => stdout += chunk);
    proc.stderr.on('data', chunk => stderr += chunk);

    // shell_spawn rejects BOTH init() and promise() on a spawn error — keep a
    // handler on promise() so ENOENT (node/dconf missing) doesn't leak.
    const exited = proc.promise();
    exited.catch(() => {});

    try {
        await proc.init();
        if (input) {
            proc.stdin.end(input);
        }
        else {
            proc.stdin.end();
        }
        await exited;
    }
    catch (error) {
        error.message = stderr ? `${error.message}\n${stderr}` : error.message;
        throw error;
    }

    return stdout;
}

module.exports = configure_gnome;
