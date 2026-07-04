const MINIMUM_DENO = '2.9.0';

if (compareVersions(Deno.version.deno, MINIMUM_DENO) < 0) {
    console.error(`NavPlace Deno Desktop requires Deno ${MINIMUM_DENO} or newer. ` + `Found Deno ${Deno.version.deno}.`);
    console.error('Older Deno versions treat "desktop" as a script path, which causes ' + 'errors like: Module not found ".../desktop".');
    console.error('Run `deno upgrade`, then retry `deno task desktop`.');
    Deno.exit(1);
}

function compareVersions(left: string, right: string): number
{
    const a = parseVersion(left);
    const b = parseVersion(right);

    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        const av = a[i] ?? 0;
        const bv = b[i] ?? 0;
        if (av !== bv) {
            return av < bv ? -1 : 1;
        }
    }

    return 0;
}

function parseVersion(value: string): number[]
{
    return value
        .split(/[.-]/)
        .slice(0, 3)
        .map((part) => Number.parseInt(part, 10) || 0);
}
