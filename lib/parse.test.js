#!/usr/bin/env mocha

const assert = require('assert');
const parse = require('./parse');

describe('parse', function () {
    it('happy path', function () {
        const tmp = parse(`
ChatGPT https://chatgpt.com/
GitHub  https://github.com/
Gmail   https://mail.google.com/
`);
        assert.ok(tmp.items.length > 1);
    });
});
