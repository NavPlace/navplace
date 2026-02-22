(function () {
    const script = document.currentScript;
    if (!script) {
        return;
    }

    const meta = {};
    script.dataset.links.split('\n').forEach(function (line) {
        if (line.startsWith('%')) {
            const i = line.indexOf(':');
            if (i !== -1) {
                meta[line.slice(1, i).trim()] = line.slice(i + 1).trim();
            }
        }
    });

    const design = script.dataset.design || meta.design || 'basic';
    const src = script.dataset.src || `${script.src.replace(/[^/]+$/, '')}../designs/${design}/index.html`;

    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.style.border = '0';
    iframe.style.width = '100%';
    iframe.style.height = '100%'; // design controls its own height
    iframe.setAttribute('tabindex', '-1'); // iframe itself is not focusable

    script.after(iframe);

    let iframe_ready = false;

    window.addEventListener('message', function (event) {
        if (event.source !== iframe.contentWindow) {
            return;
        }
        if (!event.data || event.data.type !== 'navplace:ready') {
            return;
        }
        iframe_ready = true;
        if (script.dataset.links) {
            iframe.contentWindow.postMessage({type: 'navplace:items-text', text: script.dataset.links}, '*');
        }
    });

    // Forward *any* keydown to iframe to restore focus
    document.addEventListener('keydown', function (event) {
        if (!iframe_ready) {
            return;
        }
        iframe.contentWindow.postMessage({type: 'navplace:focus'}, '*');
    });
})();
