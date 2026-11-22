import process from 'node:process';
import readline from 'node:readline';
import open from 'open';
import { fg } from './ansi.js';
import { THEME, renderFlipFrame, renderFooter, renderSide, type Side } from './card.js';
import { copyToClipboard } from './clipboard.js';
import { fetchLive, type LiveData } from './live.js';
import { displayUrl, pkg, profile } from './profile.js';
import { saveVCard } from './vcard.js';

const SURPRISES = [
    "Infrastructure is not magic — it's decisions with trade-offs.",
    'Exit codes are not enough. Add health checks.',
    "If it's not in version control, it doesn't exist.",
    'A deploy without a tested rollback is a gamble.',
    'I use Linux btw.',
    "There is no cloud, just someone else's computer.",
    'It works on my machine ¯\\_(ツ)_/¯',
    "Monitoring is not optional — it's insurance.",
    "Every outage teaches what docs can't.",
    'Logs are your conversation with the past.',
    'Containers don’t remove complexity. They relocate it.',
    'The bug was free. The downtime wasn’t.',
    'Backups are Schrödinger’s feature until restore is tested.',
    'YAML: where one space can destroy civilizations.',
    'CI/CD without tests is just faster failure delivery.',
    'Temporary fixes have excellent survival rates.',
    'Infra as Code means your mistakes are now reproducible.',
    'If alerts fire for everything, they matter for nothing.',
    'Every manual step becomes tomorrow’s incident report.',
    'A restart is not a root cause analysis.',
    'Latency is just distance charging interest.',
];

const ok = (s: string) => fg(THEME.cyan)('✔ ') + fg(THEME.text)(s);
const warn = (s: string) => fg(THEME.star)('! ') + fg(THEME.text)(s);
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export interface AppOptions {
    animate: boolean;
    offline: boolean;
}

export async function runApp(opts: AppOptions): Promise<void> {
    const out = process.stdout;
    const stdin = process.stdin;

    let side: Side = 'front';
    let live: LiveData | null = null;
    let loading = !opts.offline;
    let status = '';
    let statusTimer: NodeJS.Timeout | undefined;
    let busy = false;

    const columns = () => out.columns || 80;
    const input = () => ({ profile, version: pkg.version, live, loading, columns: columns() });

    /** Redraws from the top-left in one write, so there's no flicker. */
    const paint = (lines: string[]) => {
        out.write('\x1b[H' + lines.map(l => l + '\x1b[K').join('\n') + '\x1b[J');
    };
    const render = () => paint([...renderSide(side, input()), ...renderFooter(columns(), status)]);
    const blank = (fraction: number) => paint([...renderFlipFrame(fraction, columns()), ...renderFooter(columns(), status)]);

    const setStatus = (s: string) => {
        status = s;
        clearTimeout(statusTimer);
        statusTimer = setTimeout(() => {
            status = '';
            if (!busy) render();
        }, 4000);
        if (!busy) render();
    };

    const flipTo = async (next: Side) => {
        if (busy || next === side) return;
        if (!opts.animate) {
            side = next;
            render();
            return;
        }
        busy = true;
        for (const f of [0.7, 0.4, 0.12]) {
            blank(f);
            await sleep(26);
        }
        side = next;
        for (const f of [0.12, 0.4, 0.7]) {
            blank(f);
            await sleep(26);
        }
        busy = false;
        render();
    };

    const openLink = async (label: string, url: string) => {
        try {
            await open(url);
            setStatus(ok(`Opened ${label}`));
        } catch {
            setStatus(warn(`Couldn't open a browser: ${url}`));
        }
    };

    const quit = () => {
        clearTimeout(statusTimer);
        side = 'front';
        paint([...renderSide(side, input()), '', ' '.repeat(Math.max(0, Math.floor((columns() - 32) / 2))) + fg(THEME.dim)('Thanks for stopping by. Happy hacking!'), '']);
        if (stdin.isTTY) stdin.setRawMode(false);
        out.write('\x1b[?25h');
        process.exit(0);
    };

    // Always give the cursor back, even on a crash.
    process.on('exit', () => out.write('\x1b[?25h'));

    out.write('\x1b[2J\x1b[?25l');

    if (!opts.offline) {
        fetchLive(profile.githubUser, profile.nowUrl, 4000).then(data => {
            live = data;
            loading = false;
            if (!busy) render();
        });
    }

    if (opts.animate) {
        busy = true;
        for (const f of [0.06, 0.25, 0.5, 0.75, 0.92]) {
            blank(f);
            await sleep(30);
        }
        busy = false;
    }
    render();

    readline.emitKeypressEvents(stdin);
    stdin.setRawMode(true);
    stdin.resume();
    out.on('resize', () => {
        out.write('\x1b[2J');
        if (!busy) render();
    });

    stdin.on('keypress', (str: string | undefined, key: readline.Key | undefined) => {
        const name = key?.name ?? str;
        if (key?.ctrl && name === 'c') return quit();
        if (busy) return;

        if (side === 'qr') {
            void flipTo('front');
            return;
        }

        switch (name) {
            case 'q':
            case 'escape':
                return quit();
            case 'space':
            case 'f':
            case 'tab':
            case 'left':
            case 'right':
                return void flipTo(side === 'front' ? 'back' : 'front');
            case 's':
                return void flipTo('qr');
            case 'p':
                return void openLink(displayUrl(profile.links.portfolio), profile.links.portfolio);
            case 'g':
                return void openLink('GitHub', profile.links.github);
            case 'l':
                return void openLink('LinkedIn', profile.links.linkedin);
            case 'r':
                return void openLink('resume', profile.links.resume);
            case 'm':
                return void openLink('your mail app', `mailto:${profile.email}`);
            case 'c':
                return void copyToClipboard(profile.email).then(how => {
                    if (how === 'native') setStatus(ok(`Copied ${profile.email}`));
                    else if (how === 'osc52') setStatus(ok(`Sent ${profile.email} to your terminal's clipboard`));
                    else setStatus(warn(`No clipboard here — ${profile.email}`));
                });
            case 'v':
                try {
                    return setStatus(ok(`Saved ${saveVCard(profile)}`));
                } catch (e) {
                    return setStatus(warn(`Couldn't save the vCard: ${(e as Error).message}`));
                }
            default:
                if (str === '?' || name === 'h') {
                    return setStatus(fg(THEME.violet)('» ') + fg(THEME.text).italic(SURPRISES[Math.floor(Math.random() * SURPRISES.length)]));
                }
        }
    });
}
