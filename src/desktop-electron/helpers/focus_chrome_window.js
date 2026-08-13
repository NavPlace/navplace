const shell = require('@vbarbarosh/node-helpers/src/shell');
const chrome_wm_class_from_desktop_file = require('./chrome_wm_class_from_desktop_file');

// Chrome opens external URLs in the window it last saw active. On Wayland this
// window is often on another workspace: https://issues.chromium.org/issues/491801534
// Focusing the wanted Chrome window first makes Chrome open the new tab in it.
//
// Window list and activation come from the optional "Window Calls" GNOME
// extension (https://extensions.gnome.org/extension/4724/window-calls/).
// Without it every gdbus call fails, the caller ignores the error, and the URL
// opens with Chrome's own window choice. See docs/wayland-chrome-window.md.
async function focus_chrome_window(scheme)
{
    // shell.openExternal uses the configured URL-scheme handler. Do not steal
    // focus to Chrome when the URL will actually open somewhere else.
    const chrome_wm_class = await get_default_chrome_wm_class(scheme);
    if (!chrome_wm_class) {
        return;
    }
    const windows = await gnome_windows_list();
    const chromes = windows.filter(v => is_chrome_window(v, chrome_wm_class));
    // List order is stacking order, bottom to top: the last match is the most recently raised.
    const target = chromes.filter(v => v.in_current_workspace).at(-1) ?? chromes.at(-1);
    if (target && !target.focus) {
        await gnome_windows_call('Activate', [String(target.id)]);
    }
}

async function get_default_chrome_wm_class(scheme)
{
    const desktop_file = await shell(['xdg-settings', 'get', 'default-url-scheme-handler', scheme]);
    return chrome_wm_class_from_desktop_file(desktop_file.trim());
}

function is_chrome_window(win, chrome_wm_class)
{
    // Installed web apps report wm_class_instance "crx_<id>" and cannot host regular tabs.
    return win.wm_class_instance === chrome_wm_class;
}

async function gnome_windows_list()
{
    const reply = await gnome_windows_call('List', []);
    // gdbus prints the reply as a GVariant tuple: ('<json>',) — or ("<json>",)
    // when a window title contains a single quote. Inside, only the delimiter
    // and the backslash are backslash-escaped.
    const match = reply.match(/^\((['"])(.*)\1,\)\s*$/s);
    if (!match) {
        throw new Error(`unexpected gdbus List reply: ${reply}`);
    }
    return JSON.parse(match[2].replace(/\\(["'\\])/g, '$1'));
}

function gnome_windows_call(method, args)
{
    return shell([
        'gdbus',
        'call',
        '--session',
        '--dest', 'org.gnome.Shell',
        '--object-path', '/org/gnome/Shell/Extensions/Windows',
        '--method', `org.gnome.Shell.Extensions.Windows.${method}`,
        ...args,
    ]);
}

module.exports = focus_chrome_window;
