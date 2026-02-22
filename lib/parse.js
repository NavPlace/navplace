function parse(expr)
{
    const meta = {};
    const items = [];
    let ns_block = [];
    let namespaces = [];

    for (const raw of expr.split('\n')) {
        const line = raw.trim();
        if (!line) {
            if (ns_block.length) {
                namespaces = parse_namespace_block(ns_block);
                ns_block = [];
            }
            continue;
        }

        if (line[0] === '%') {
            Object.assign(meta, parse_meta_line(line));
            continue;
        }

        if (line[0] === '#') {
            ns_block.push(line);
            continue;
        }

        if (ns_block.length) {
            namespaces = parse_namespace_block(ns_block);
            ns_block = [];
        }

        items.push(parse_item_line(line, namespaces));
    }

    if (meta.ns) {
        return {meta, items: items.filter(v => v.namespaces.some(ns => meta.ns.includes(ns)))};
    }

    return {meta, items};

    // return expr.trim().split('\n').filter(v => v[0] !== '#').map(v => v.trim()).filter(Boolean).map(function (line) {
    //     // [label][@image]https://...
    //     const m = line.match(/^(.*?)(?:\s+(@\S+))?\s+(https?:\/\/\S+)$/);
    //     if (!m) {
    //         throw new Error(`Invalid line format: ${line}`);
    //     }
    //     let label = (m[1] || '').trim();
    //     const image_url = m[2] ? `private://${m[2].slice(1)}` : null;
    //     const href = m[3];
    //     const domain = new URL(href).host;
    //     if (!label) {
    //         label = url.pathname && url.pathname !== '/'
    //             ? `${domain}${url.pathname}`
    //             : domain;
    //     }
    //
    //     return {
    //         label,
    //         href,
    //         icon_url: `app://favicon/${domain}`,
    //         image_url,
    //         search: transliterate(`${label} ${href}`),
    //     };
    // });

    function transliterate(input)
    {
        const map = {
            'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i',
            'й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t',
            'у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y',
            'ь':'','э':'e','ю':'yu','я':'ya'
        };

        return input.toLowerCase().split('').map(ch => map[ch] || ch).join('');
    }

    function norm(s)
    {
        return s.trim().replace(/\s+/g, ' ');
    }

    function parse_namespace_block(block)
    {
        return block
            .map(l => l.replace(/^#+/, '').trim())
            .join(' ')
            .split('|')
            .map(norm)
            .filter(Boolean);
    }

    function parse_meta_line(line)
    {
        // % key: value
        const m = line.match(/^%\s*([^:]+)\s*:\s*(.+)$/);
        if (!m) {
            throw new Error(`Invalid meta line: ${line}`);
        }

        const key = norm(m[1]);
        const value = m[2].trim();

        if (key === 'ns') {
            return {ns: value.split('|').map(norm).filter(Boolean)};
        }
        else {
            return {[key]: value};
        }
    }

    function parse_item_line(line, namespaces)
    {
        // 1) extract href (always last)
        const m = line.match(/^(.*?)(https?:\/\/\S+)$/);
        if (!m) {
            throw new Error(`Invalid line: ${line}`);
        }

        let head = m[1].trim();
        const href = m[2];

        // 2) extract image
        let image_url = null;
        head = head.replace(/\s+(@\S+)\s*$/, function (_, img) {
            image_url = 'private://' + img.slice(1);
            return '';
        }).trim();

        // 3) extract tags & meta
        const tags = [];
        const meta = {};

        head = head.replace(/#([a-zA-Z0-9_-]+)(?:=([^\s#]+))?/g, function (_, key, value) {
            if (value === undefined) {
                tags.push(key);
            } else {
                meta[key] = value;
            }
            return '';
        }).trim();

        // 4) label
        const url = new URL(href);
        const domain = url.host;
        const label = head || (url.pathname && url.pathname !== '/' ? `${domain}${url.pathname}` : domain);

        return {
            label,
            href,
            // icon_url: (typeof window === 'undefined' || window.ElectronApp) ? `app://favicon/${domain}` : `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
            icon_url: (typeof window === 'undefined' || window.ElectronApp) ? `app://favicon/${domain}` : `https://icon.horse/icon/${domain}`,
            image_url,
            tags,
            meta,
            search: transliterate(`${label} ${href} ${tags.join(' ')}`),
            namespaces,
        };
    }
}

if (typeof module !== 'undefined') {
    module.exports = parse;
}
