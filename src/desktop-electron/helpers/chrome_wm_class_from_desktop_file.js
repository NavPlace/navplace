const WM_CLASSES = new Map([
    ['google-chrome.desktop', 'google-chrome'],
    ['google-chrome-beta.desktop', 'google-chrome-beta'],
    ['google-chrome-unstable.desktop', 'google-chrome-unstable'],
]);

function chrome_wm_class_from_desktop_file(desktop_file)
{
    return WM_CLASSES.get(desktop_file) ?? null;
}

module.exports = chrome_wm_class_from_desktop_file;
