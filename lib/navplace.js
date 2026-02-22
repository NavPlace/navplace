// Temporary, just for prototype
document.write(`<script src="${document.currentScript.src.replace(/[^/]+$/, '')}filter1_from_spec.js"></script>`);
document.write(`<script src="${document.currentScript.src.replace(/[^/]+$/, '')}parse.js"></script>`);

window.__NAVPLACE_INST__ = null;
window.__NAVPLACE_EXTERNAL_TEXT__ = null;

if (window.parent !== window) {
    window.addEventListener('message', function (event) {
        console.log('message', event);
        if (!event.data) {
            return;
        }
        if (event.data.type === 'navplace:items-text') {
            if (window.__NAVPLACE_INST__) {
                window.__NAVPLACE_INST__.replace(event.data.text || '');
            }
            else {
                window.__NAVPLACE_EXTERNAL_TEXT__ = event.data.text || '';
            }
        }
        if (event.data.type === 'navplace:focus') {
            const input = document.querySelector('input[type=search]') || document.querySelector('input');
            if (input) {
                input.focus();
            }
        }
    });
    console.log('postMessage navplace:ready');
    window.parent.postMessage({type: 'navplace:ready' }, '*');
}

function navplace(params)
{
    params = params || {};
    params.input = params.input || 'input[type=search]';
    params.update = params.update || function () {};
    params.meta = params.meta || {};

    window.__NAVPLACE_INST__ = {
        replace: function (text) {
            console.log('window.__NAVPLACE_INST__', text);
            const tmp = parse(text);
            Object.entries(params.meta).forEach(function ([meta_key, selector]) {
                if (tmp.meta[meta_key]) {
                    const elem = document.querySelector(selector);
                    if (elem) {
                        elem.innerText = tmp.meta[meta_key];
                    }
                    if (meta_key === 'email' && elem.tagName === 'A') {
                        elem.href = tmp.meta[meta_key];
                    }
                }
            });
            all_items.push(...tmp.items);
            setTimeout(update, 0);
        },
    };

    const all_items = [];
    const filtered_items = [];

    if (typeof params.input === 'string') {
        params.input = document.querySelector(params.input);
    }
    if (params.input) {
        params.input.addEventListener('input', function () {
            update();
        });
    }

    document.addEventListener('keydown', function (event) {
        // 1. Ignore IME composition
        if (event.isComposing) {
            return;
        }
        // 2. Ignore modifier combos
        if (event.ctrlKey || event.metaKey || event.altKey) {
            return;
        }
        if (event.key === 'Enter' && filtered_items[0]?.href) {
            if (params.navigate) {
                params.navigate(filtered_items[0]);
            }
            else {
                event.preventDefault();
                navplace.navigate(filtered_items[0]);
            }
        }
        // 3. Ignore non-printable keys
        if (event.key.length !== 1) {
            return;
        }
        if (document.activeElement !== params.input && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) && !document.activeElement?.isContentEditable) {
            params.input.focus();
        }
    });
    params.input.focus();

    if (window.ElectronApp?.api_items_all) {
        window.ElectronApp.api_items_all().then(v => all_items.push(...v.items)).then(update);
    }
    else if (window.__NAVPLACE_EXTERNAL_TEXT__ !== null) {
        window.__NAVPLACE_INST__.replace(window.__NAVPLACE_EXTERNAL_TEXT__);
    }
    else {
        all_items.push(...parse(`
ChatGPT https://chatgpt.com/
GitHub  https://github.com/
Gmail   https://mail.google.com/
`).items);
        setTimeout(update, 0);
    }

    function update() {
        const filter = filter1_from_spec(params.input.value);
        filtered_items.splice(0, filtered_items.length, ...all_items.filter(v => filter(v.search)));
        params.update(filtered_items);
    }
}

navplace.navigate = function (item, event) {
    event?.preventDefault();
    if (window.ElectronApp) {
        window.open(item.href, '_blank', 'noopener,noreferrer');
    }
    else {
        window.open(item.href, '_top', 'noopener,noreferrer');
    }
};
