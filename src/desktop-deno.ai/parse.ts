export interface NavPlaceCollection {
    meta: Record<string, string | string[]>;
    items: NavPlaceItem[];
}

export interface NavPlaceItem {
    label: string;
    href: string;
    icon_url: string | null;
    image_url: string | null;
    tags: string[];
    meta: Record<string, string>;
    search1: string;
    search2: string;
    namespaces: string[];
    break?: boolean;
}

export interface ParseOptions {
    desktopUrls?: boolean;
}

export function parseCollection(expr: string, options: ParseOptions = {}): NavPlaceCollection
{
    const meta: Record<string, string | string[]> = {};
    const items: NavPlaceItem[] = [];
    let nsBlock: string[] = [];
    let namespaces: string[] = [];

    for (const raw of expr.split('\n')) {
        const line = raw.trim();
        if (!line) {
            if (nsBlock.length) {
                namespaces = parseNamespaceBlock(nsBlock);
                nsBlock = [];
            }
            continue;
        }

        if (line[0] === '%') {
            Object.assign(meta, parseMetaLine(line));
            continue;
        }

        if (line[0] === '#') {
            nsBlock.push(line);
            continue;
        }

        if (nsBlock.length) {
            namespaces = parseNamespaceBlock(nsBlock);
            nsBlock = [];
        }

        const item = parseItemLine(line, namespaces, options);
        if (item) {
            items.push(item);
        }
    }

    if (Array.isArray(meta.ns)) {
        return {
            meta,
            items: items.filter((item) => item.namespaces.some((ns) => (meta.ns as string[]).includes(ns))),
        };
    }

    return { meta, items };
}

function transliterate(input: string): string
{
    const map: Record<string, string> = {
        а: 'a',
        б: 'b',
        в: 'v',
        г: 'g',
        д: 'd',
        е: 'e',
        ё: 'yo',
        ж: 'zh',
        з: 'z',
        и: 'i',
        й: 'y',
        к: 'k',
        л: 'l',
        м: 'm',
        н: 'n',
        о: 'o',
        п: 'p',
        р: 'r',
        с: 's',
        т: 't',
        у: 'u',
        ф: 'f',
        х: 'kh',
        ц: 'ts',
        ч: 'ch',
        ш: 'sh',
        щ: 'shch',
        ъ: '',
        ы: 'y',
        ь: '',
        э: 'e',
        ю: 'yu',
        я: 'ya',
    };

    return input
        .toLowerCase()
        .split('')
        .map((ch) => map[ch] || ch)
        .join('');
}

function norm(value: string): string
{
    return value.trim().replace(/\s+/g, ' ');
}

function parseNamespaceBlock(block: string[]): string[]
{
    return block
        .map((line) => line.replace(/^#+/, '').trim())
        .join(' ')
        .split('|')
        .map(norm)
        .filter(Boolean);
}

function parseMetaLine(line: string): Record<string, string | string[]>
{
    const match = line.match(/^%\s*([^:]+)\s*:\s*(.+)$/);
    if (!match) {
        throw new Error(`Invalid meta line: ${line}`);
    }

    const key = norm(match[1]);
    const value = match[2].trim();

    if (key === 'ns') {
        return { ns: value.split('|').map(norm).filter(Boolean) };
    }

    return {
        [key]: value,
    };
}

function parseItemLine(line: string, namespaces: string[], options: ParseOptions): NavPlaceItem | null
{
    const match = line.match(/^(.*?)(file:\/\/\S+|https?:\/\/\S+)$/);
    if (!match) {
        return null;
    }

    let head = match[1].trim();
    const href = match[2];

    let imageUrl: string | null = null;
    head = head
        .replace(/\s+(@\S+)\s*$/, (_, img: string) => {
            const rel = img.slice(1);
            imageUrl = options.desktopUrls ? `/private/${encodePath(rel)}` : `private://${rel}`;
            return '';
        })
        .trim();

    const tags: string[] = [];
    const meta: Record<string, string> = {};
    head = head
        .replace(/#([a-zA-Z0-9_-]+)(?:=([^\s#]+))?/g, (_, key: string, value: string | undefined) => {
            if (value === undefined) {
                tags.push(key);
            } else {
                meta[key] = value;
            }
            return '';
        })
        .trim();

    const url = new URL(href);
    const domain = url.host;
    const label = head || (url.pathname && url.pathname !== '/' ? `${domain}${url.pathname}` : domain);

    return {
        label,
        href,
        icon_url: domain ? (options.desktopUrls ? `/app/favicon/${encodeURIComponent(domain)}` : `app://favicon/${domain}`) : null,
        image_url: imageUrl,
        tags,
        meta,
        search1: transliterate(`${label} ${tags.join(' ')}`),
        search2: transliterate(href),
        namespaces,
    };
}

function encodePath(path: string): string
{
    return path.split('/').map(encodeURIComponent).join('/');
}
