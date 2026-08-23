// options: {prefix, suffix, tags} decorate every item — used by `% include:`
function parse(expr, options)
{
    options = options || {};
    const prefix = options.prefix || '';
    const suffix = options.suffix || '';
    const common_tags = options.tags || [];
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
            const directive = parse_meta_line(line);
            // `% include:` is repeatable; every other directive keeps its last value
            if (directive.include) {
                directive.include = [...(meta.include || []), ...directive.include];
            }
            Object.assign(meta, directive);
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

        const item = parse_item_line(line, namespaces);
        if (item) {
            items.push(item);
        }
    }

    // `% include:` hands a pulled document the ns of the document pulling it,
    // so the filter runs over local and pulled links alike
    const ns = options.ns || meta.ns;
    if (ns) {
        return {meta, items: items.filter(v => v.namespaces.some(name => ns.includes(name)))};
    }

    return {meta, items};

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
        else if (key === 'include') {
            return {include: [value]};
        }
        else {
            return {[key]: value};
        }
    }

    function parse_item_line(line, namespaces)
    {
        // 1) extract href (always last)
        const m = line.match(/^(.*?)(file:\/\/\S+|https?:\/\/\S+)$/);
        if (!m) {
            return null;
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
        const line_tags = [];
        const meta = {};

        head = head.replace(/#([a-zA-Z0-9_-]+)(?:=([^\s#]+))?/g, function (_, key, value) {
            if (value === undefined) {
                line_tags.push(key);
            } else {
                meta[key] = value;
            }
            return '';
        }).trim();

        const tags = [...line_tags, ...common_tags];

        // 4) label
        const url = new URL(href);
        const domain = url.host;
        const plain_label = head || (url.pathname && url.pathname !== '/' ? `${domain}${url.pathname}` : domain);
        const label = [prefix, plain_label, suffix].filter(Boolean).join(' ');

        return {
            label,
            href,
            // icon_url: (typeof window === 'undefined' || window.ElectronApp) ? `app://favicon/${domain}` : `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
            icon_url: (typeof window === 'undefined' || window.ElectronApp) ? `app://favicon/${domain}` : `https://icon.horse/icon/${domain}`,
            image_url,
            tags,
            meta,
            search1: transliterate(`${label} ${tags.join(' ')}`),
            search2: transliterate(href),
            namespaces,
        };
    }
}

if (typeof module !== 'undefined') {
    module.exports = parse;
}
