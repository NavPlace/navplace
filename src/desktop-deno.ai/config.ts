import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from '@std/yaml';

export interface Config {
    configDir: string;
    userDataDir: string;
    repoRoot: string;
    designsDir: string;
    libDir: string;
    settingsFile: string;
    readmeFile: string;
    socketFile: string;
    personalAccessToken: string | null;
    collectionUrl: string | null;
    eventsUrl: string | null;
}

export async function loadConfig(): Promise<Config>
{
    const moduleDir = dirname(fileURLToPath(import.meta.url));
    const repoRoot = resolve(moduleDir, '../..');
    const home = homeDir();
    const configDir = resolve(home, '.navplace');
    const userDataDir = resolve(Deno.env.get('XDG_CONFIG_HOME') || resolve(home, '.config'), 'navplace');
    const settingsFile = join(configDir, 'settings.yaml');
    const settings = await readSettings(settingsFile);

    const eventsUrl =
        optionalString(settings.events_url)
            ?.replace(/^http:\/\//, 'ws://')
            .replace(/^https:\/\//, 'wss://') ?? null;

    return {
        configDir,
        userDataDir,
        repoRoot,
        designsDir: resolve(repoRoot, 'designs'),
        libDir: resolve(repoRoot, 'lib'),
        settingsFile,
        readmeFile: join(configDir, 'README.md'),
        socketFile: join(userDataDir, 'navplace.sock'),
        personalAccessToken: optionalString(settings.personal_access_token),
        collectionUrl: optionalString(settings.collection_url),
        eventsUrl,
    };
}

function homeDir(): string
{
    const home = Deno.env.get('HOME') || Deno.env.get('USERPROFILE') || windowsHomeDir();
    if (!home) {
        throw new Error('Unable to resolve home directory from environment');
    }
    return home;
}

function windowsHomeDir(): string | undefined
{
    const drive = Deno.env.get('HOMEDRIVE');
    const path = Deno.env.get('HOMEPATH');
    return drive && path ? `${drive}${path}` : undefined;
}

export async function ensureDir(path: string): Promise<void>
{
    await Deno.mkdir(path, { recursive: true });
}

async function readSettings(file: string): Promise<Record<string, unknown>>
{
    try {
        const text = await Deno.readTextFile(file);
        const parsed = parseYaml(text);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed as Record<string, unknown>;
        }
    }
    catch (error) {
        if (!(error instanceof Deno.errors.NotFound)) {
            throw error;
        }
    }
    return {};
}

function optionalString(value: unknown): string | null
{
    if (typeof value !== 'string') {
        return null;
    }
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}
