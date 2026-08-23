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

    it('meta, tags, and images', function () {
        const actual = parse(`
% design: github
% foo: bar

ChatGPT #aa #xx=yy https://chatgpt.com/
GitHub  #aa https://github.com/
Gmail   #bb @img/gmail.png https://mail.google.com/
`);

        assert.deepStrictEqual(actual, {
            meta: {design: 'github', foo: 'bar'},
            items: [
                {
                    label: 'ChatGPT',
                    href: 'https://chatgpt.com/',
                    icon_url: 'app://favicon/chatgpt.com',
                    image_url: null,
                    tags: ['aa'],
                    meta: {xx: 'yy'},
                    search1: 'chatgpt aa',
                    search2: 'https://chatgpt.com/',
                    namespaces: []
                },
                {
                    label: 'GitHub',
                    href: 'https://github.com/',
                    icon_url: 'app://favicon/github.com',
                    image_url: null,
                    tags: ['aa'],
                    meta: {},
                    search1: 'github aa',
                    search2: 'https://github.com/',
                    namespaces: []
                },
                {
                    label: 'Gmail',
                    href: 'https://mail.google.com/',
                    icon_url: 'app://favicon/mail.google.com',
                    image_url: 'private://img/gmail.png',
                    tags: ['bb'],
                    meta: {},
                    search1: 'gmail bb',
                    search2: 'https://mail.google.com/',
                    namespaces: []
                }
            ]
        });
    });

    it('skips invalid lines', function () {
        const tmp = parse(`
asdfa asf saf
GitHub https://github.com/
`);
        assert.equal(tmp.items.length, 1);
        assert.equal(tmp.items[0].label, 'GitHub');
    });

    it('collects every include directive', function () {
        const tmp = parse(`
% design: github
% include: https://a.example.com/links.md
% include: https://b.example.com/links.md #work #prefix=ACME/
`);

        assert.deepStrictEqual(tmp.meta, {
            design: 'github',
            include: [
                'https://a.example.com/links.md',
                'https://b.example.com/links.md #work #prefix=ACME/',
            ],
        });
    });

    it('filters by the ns given in options, not by the one in the document', function () {
        const tmp = parse(`
% ns: Personal

# Work
Jira    https://jira.example.com/

# Personal
Netflix https://netflix.example.com/
`, {ns: ['Work']});

        assert.deepStrictEqual(tmp.items.map(v => v.label), ['Jira']);
    });

    it('decorates items with prefix, suffix, and common tags', function () {
        const actual = parse('GitHub #dev https://github.com/', {prefix: 'ACME/', suffix: ' ↗', tags: ['work']});

        assert.deepStrictEqual(actual.items, [
            {
                label: 'ACME/GitHub ↗',
                href: 'https://github.com/',
                icon_url: 'app://favicon/github.com',
                image_url: null,
                tags: ['dev', 'work'],
                meta: {},
                search1: 'acme/github ↗ dev work',
                search2: 'https://github.com/',
                namespaces: []
            }
        ]);
    });
});
