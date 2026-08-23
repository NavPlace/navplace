const http_get_utf8 = require('@vbarbarosh/node-helpers/src/http_get_utf8');
const parse = require('../../../lib/parse');
const parse_include_spec = require('./parse_include_spec');

// `% include:` pulls another document into this one. The directive belongs to
// the desktop app; the web app and the embed widget ignore it.
//
// A pulled document contributes links and sections only — its own directives
// are dropped before parsing, so it cannot switch the design, apply `% ns:`,
// or pull further documents. The pull happens first and `% ns:` runs after it:
// the filter of the pulling document gates local and pulled links alike. The
// request carries no access token: an include url is a stranger.
async function resolve_includes(collection)
{
    const specs = (collection.meta.include || []).map(parse_include_spec);
    const items = [...collection.items];

    for (const spec of specs) {
        if (!spec.url.startsWith('http://') && !spec.url.startsWith('https://')) {
            console.error('[include_skipped]', spec.url);
            continue;
        }
        try {
            // Startup waits for this — a silent url must not hold the window back.
            const text = await http_get_utf8(spec.url, {timeout: 5000});
            const included = parse(drop_directives(text), {...spec, ns: collection.meta.ns});
            console.log('[include_ok]', spec.url, `items=${included.items.length}`);
            items.push(...included.items);
        }
        catch (error) {
            // One dead url keeps the rest of the collection alive.
            console.error('[include_failed]', spec.url, error.message);
        }
    }

    return {meta: collection.meta, items};
}

function drop_directives(text)
{
    return text.split('\n').filter(v => !v.trim().startsWith('%')).join('\n');
}

module.exports = resolve_includes;
