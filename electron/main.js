const Promise = require('bluebird');
const cli = require('@vbarbarosh/node-helpers/src/cli');
const electron = require('electron');
const format_date = require('@vbarbarosh/node-helpers/src/format_date');
const fs = require('fs');
const fs_mkdirp = require('@vbarbarosh/node-helpers/src/fs_mkdirp');
const fs_path_dirname = require('@vbarbarosh/node-helpers/src/fs_path_dirname');
const fs_path_resolve = require('@vbarbarosh/node-helpers/src/fs_path_resolve');
const fs_read = require('@vbarbarosh/node-helpers/src/fs_read');
const fs_read_utf8 = require('@vbarbarosh/node-helpers/src/fs_read_utf8');
const fs_readdir = require('@vbarbarosh/node-helpers/src/fs_readdir');
const fs_write = require('@vbarbarosh/node-helpers/src/fs_write');
const parse = require('../lib/parse');
const sanitize_filename = require('@vbarbarosh/node-helpers/src/sanitize_filename');
const urlmod = require('@vbarbarosh/node-helpers/src/urlmod');

cli(main);

async function main()
{
    if (require('electron-squirrel-startup')) {
        app.quit();
        return;
    }

    await electron.app.whenReady();

    electron.ipcMain.handle('api_ping', function (event, ...args) {
        return `pong ${format_date(new Date())}`;
    });
    electron.ipcMain.handle('api_items_all', async function () {
        return parse(await fs_read_utf8(fs_path_resolve(process.env.HOME, '.navplace/README.md')));
    });

    const win = new electron.BrowserWindow({
        autoHideMenuBar: true,
        width: 1200,
        height: 1000,
        center: true,
        backgroundColor: '#bec2bd',
        webPreferences: {
            zoomFactor: 1.25,
            // (node:127005) electron: The default of contextIsolation
            // is deprecated and will be changing from false to true
            // in a future release of Electron. See
            // https://github.com/electron/electron/issues/23506 for
            // more information
            contextIsolation: true,
            nodeIntegration: false,
            preload: fs_path_resolve(__dirname, 'renderer.js'),
        },
    });

    electron.protocol.handle('private', async function (request) {
        // XXX fs.promises.realpath will throw if file does not exist
        const root = await fs.promises.realpath(fs_path_resolve(process.env.HOME, '.navplace')) + '/';
        const rel = decodeURIComponent(request.url.slice('private://'.length));
        const abs = await fs.promises.realpath(fs_path_resolve(root, rel));
        if (!abs.startsWith(root)) {
            return new Response('Forbidden', {status: 403});
        }
        const buf = await fs_read(abs);
        return new Response(buf, {
            headers: {
                'Content-Type': abs.endsWith('.svg') ? 'image/svg+xml' : 'image/png',
                'Cache-Control': 'max-age=86400',
            },
        });
    });
    electron.protocol.handle('app', async function (request) {
        if (!request.url.startsWith('app://favicon/')) {
            return new Response('Not found', {status: 404});
        }
        const domain = decodeURIComponent(request.url.slice('app://favicon/'.length));
        const file = fs_path_resolve(__dirname, `../data/favicons/${sanitize_filename(domain)}.png`);
        await fs_mkdirp(fs_path_dirname(file));
        const buf = await cache({
            get: () => fs_read(file),
            set: v => fs_write(file, v),
            refresh: () => fetch(urlmod('https://www.google.com/s2/favicons?domain=&sz=64', {domain})).then(async v => Buffer.from(await v.arrayBuffer())),
        });
        return new Response(buf, {
            headers: {
                'Content-Type': 'image/png', // response.headers.get('content-type') || 'image/png',
                'Cache-Control': 'max-age=86400',
            },
        });
    });

    electron.session.defaultSession.webRequest.onBeforeRequest(function (params, callback) {
        const prefixes = [
            'app://favicon/',
            'blob:',
            'chrome://',
            'chrome-devtools://',
            'data:',
            'devtools://',
            'file://',
            'private://',
        ];
        callback({cancel: !prefixes.some(v => params.url.startsWith(v))});
    });

    win.webContents.setWindowOpenHandler(function (event) {
        electron.shell.openExternal(event.url);
        return {action: 'deny'};
    });

    // 🔶 Ctrl+Shift+I to open
    // win.webContents.openDevTools({mode: 'bottom', activate: false});
    //
    // setInterval(function () {
    //     win.webContents.executeJavaScript('console.log("js from main", new Date())');
    // }, 2000);

    // await win.loadFile(fs_path_resolve(__dirname, '../designs/basic/index.html'));
    // await win.loadFile(fs_path_resolve(__dirname, '../designs/google-chrome/index.html'));
    const tmp = parse(await fs_read_utf8(fs_path_resolve(process.env.HOME, '.navplace/README.md')));
    const design = make_enum(tmp.meta.design, ['github', ...await fs_readdir(fs_path_resolve(__dirname, '../designs'))]);
    await win.loadFile(fs_path_resolve(__dirname, `../designs/${design}/index.html`));
    await once(win, {
        closed: function () {
            console.log('__closed');
        },
        blur: function () {
            console.log('__blur');
            win.close();
        },
    });
}

async function once(inst, spec)
{
    const listeners = [];
    return new Promise(function (resolve) {
        Object.keys(spec).forEach(function (name) {
            async function handler(...args) {
                listeners.forEach(v => inst.off(v.name, v.handler));
                resolve(await spec[name](...args));
            }
            listeners.push({name, handler});
            inst.on(name, handler);
        });
    });
}

async function cache({get, set, refresh})
{
    try {
        return await get();
    }
    catch {
    }

    const value = await refresh();
    await set(value);
    return value;
}

function make_enum(value, options, default_value = options[0])
{
    if (options.includes(value)) {
        return value;
    }
    return default_value;
}
