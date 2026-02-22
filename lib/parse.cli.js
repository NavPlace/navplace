#!/usr/bin/env node

const parse = require('./parse');
const cli = require('@vbarbarosh/node-helpers/src/cli');
const fs_read_utf8 = require('@vbarbarosh/node-helpers/src/fs_read_utf8');
const fs_path_resolve = require('@vbarbarosh/node-helpers/src/fs_path_resolve');

cli(main);

async function main()
{
    // const items = parse(await fs_read_utf8(fs_path_resolve(process.env.HOME, '.navplace/README.md')));
    const items = parse(`
% design: github
% ns: foo

# foo
ChatGPT https://chatgpt.com/
# bar
GitHub  https://github.com/
# foo | bar
Gmail   https://mail.google.com/
    `);
    console.log(items);
}
