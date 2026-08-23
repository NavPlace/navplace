const assert = require('node:assert/strict');
const parse_include_spec = require('./parse_include_spec');
const test = require('node:test');

test('reads the url alone', function () {
    assert.deepEqual(parse_include_spec('https://example.com/links.md'), {
        url: 'https://example.com/links.md',
        tags: [],
        prefix: '',
        suffix: '',
    });
});

test('reads common tags, prefix, and suffix', function () {
    assert.deepEqual(parse_include_spec('  https://example.com/links.md  #work #shared #prefix=ACME/ #suffix=! '), {
        url: 'https://example.com/links.md',
        tags: ['work', 'shared'],
        prefix: 'ACME/',
        suffix: '!',
    });
});

test('ignores options it does not know', function () {
    assert.deepEqual(parse_include_spec('https://example.com/links.md #design=github #ns=work'), {
        url: 'https://example.com/links.md',
        tags: [],
        prefix: '',
        suffix: '',
    });
});
