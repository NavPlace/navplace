// The value of a `% include:` line: the url first, then optional decorations
// for every pulled item. `#tag` adds a common tag, `#prefix=` and `#suffix=`
// wrap the label. Values hold no spaces — the rule item lines already follow.
//
//     https://example.com/links.md #work #prefix=ACME/
function parse_include_spec(value)
{
    const [url, ...rest] = value.trim().split(/\s+/);
    const out = {url, tags: [], prefix: '', suffix: ''};

    for (const [, key, option] of rest.join(' ').matchAll(/#([a-zA-Z0-9_-]+)(?:=([^\s#]+))?/g)) {
        if (option === undefined) {
            out.tags.push(key);
        }
        else if (key === 'prefix') {
            out.prefix = option;
        }
        else if (key === 'suffix') {
            out.suffix = option;
        }
    }

    return out;
}

module.exports = parse_include_spec;
