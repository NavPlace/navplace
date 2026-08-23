const assert = require('node:assert/strict');
const http = require('node:http');
const parse = require('../../../lib/parse');
const resolve_includes = require('./resolve_includes');
const test = require('node:test');

const REMOTE = `% design: showcase
% ns: nothing
% include: https://deeper.example.com/links.md

# Work
Jira        #tracker    https://jira.example.com/

# Personal
Netflix                 https://netflix.example.com/
`;

test('appends the links and sections of a pulled document', async function () {
    await using server = await serve(REMOTE);

    const collection = parse(`% design: github
% include: ${server.url} #work #prefix=ACME/

Local   https://local.example.com/
`);
    const actual = await resolve_includes(collection);

    assert.equal(actual.meta.design, 'github');
    assert.deepEqual(actual.items.map(v => [v.label, v.href, v.tags, v.namespaces]), [
        ['Local', 'https://local.example.com/', [], []],
        ['ACME/Jira', 'https://jira.example.com/', ['tracker', 'work'], ['Work']],
        ['ACME/Netflix', 'https://netflix.example.com/', ['work'], ['Personal']],
    ]);
});

test('the ns of the pulling document gates pulled links too', async function () {
    await using server = await serve(REMOTE);

    const collection = parse(`% ns: Work
% include: ${server.url}

# Work
Local   https://local.example.com/

# Personal
Hidden  https://hidden.example.com/
`);
    const actual = await resolve_includes(collection);

    assert.deepEqual(actual.items.map(v => v.label), ['Local', 'Jira']);
});

test('keeps the collection when a url is dead', async function () {
    const collection = parse(`% include: http://127.0.0.1:1/links.md

Local   https://local.example.com/
`);
    const actual = await resolve_includes(collection);

    assert.deepEqual(actual.items.map(v => v.label), ['Local']);
});

async function serve(text)
{
    const server = http.createServer((req, res) => res.end(text));
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));

    return {
        url: `http://127.0.0.1:${server.address().port}/links.md`,
        async [Symbol.asyncDispose]() {
            await new Promise(resolve => server.close(resolve));
        },
    };
}
