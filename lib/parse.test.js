#!/usr/bin/env mocha

const assert = require('assert');
const parse = require('./parse');

const tests = [
    ["''", ''],
    ['1', '1'],
    ['a', 'a'],
    ['A', 'A'],
    ['@', '@'],
    ["%", '%'],
    ['_', '_'],
    ['+', '+'],
    ["'#'", '#'],
    ["'$'", '$'],
    ["'~'", '~'],
    ["'!'", '!'],
    ["'^'", '^'],
    ["'&'", '&'],
    ["'*'", '*'],
    ["'('", '('],
    ["')'", ')'],
    ['abc', 'abc'],
    ['123', '123'],
    ['abc123', 'abc123'],
    ["hello_abc", 'hello_abc'],
    ["hello-abc", 'hello-abc'],
    ["hello+abc", 'hello+abc'],
    ["hello%abc", 'hello%abc'],
    ["'hello abc'", 'hello abc'],
    ["'hello $abc'", 'hello $abc'],
    ["'hello \"abc'", 'hello "abc'],
    ["'hello '\\'abc'", 'hello \'abc'],
];

describe('parse', function () {
    tests.forEach(function ([expected, ...args]) {
        const items = parse(`
ChatGPT https://chatgpt.com/
GitHub  https://github.com/
Gmail   https://mail.google.com/
`);
        console.log(items);
    });
});

function escape_shell_arg(s)
{
    if (s.match(/^[0-9a-z@_+%-]+$/i)) {
        return s;
    }
    return `'${s.replace(/'/g, "'\\'")}'`;
}
