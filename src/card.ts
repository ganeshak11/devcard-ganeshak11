import chalk from 'chalk';
import qrcode from 'qrcode-terminal';
import { bg, fg, gradient, hex, isLight, mix, padEnd, truncate, width, type RGB } from './ansi.js';
import { initials, monogram, renderPixels } from './pixels.js';
import { displayUrl, type Profile } from './profile.js';
import { timeAgo, type LiveData } from './live.js';

export const THEME = {
    card: hex('#0d1117'),
    text: hex('#e6edf3'),
    dim: hex('#7d8590'),
    faint: hex('#30363d'),
    violet: hex('#a78bfa'),
    cyan: hex('#22d3ee'),
    star: hex('#e3b341'),
    borderFrom: hex('#8b5cf6'),
    borderTo: hex('#22d3ee'),
};

/** Brand colors for the stack badges; anything else gets a neutral badge. */
const BADGE_COLORS: Record<string, string> = {
    docker: '#2496ed',
    kubernetes: '#326ce5',
    terraform: '#7b42bc',
    aws: '#ff9900',
    'github actions': '#2088ff',
    linux: '#fcc624',
    git: '#f05032',
    typescript: '#3178c6',
    node: '#5fa04e',
    'node.js': '#5fa04e',
    python: '#3776ab',
    go: '#00add8',
    ansible: '#ee0000',
    prometheus: '#e6522c',
    grafana: '#f46800',
};

export type Side = 'front' | 'back' | 'qr';

/** Rows inside the border. Tall enough for the QR code. */
export const INNER_HEIGHT = 15;
const MAX_WIDTH = 70;

export interface Layout {
    /** Card width including the border. */
    width: number;
    /** Spaces before the card so it sits centred. */
    margin: number;
}

export function layout(columns: number): Layout {
    const cols = columns > 0 ? columns : 80;
    const w = Math.max(40, Math.min(MAX_WIDTH, cols - 2));
    return { width: w, margin: Math.max(0, Math.floor((cols - w) / 2)) };
}

const text = fg(THEME.text);
const dim = fg(THEME.dim);
const faint = fg(THEME.faint);

/** A section heading followed by a faint rule to the edge. */
function heading(label: string, w: number, right = ''): string {
    const head = fg(THEME.violet).bold(label);
    const fill = Math.max(1, w - label.length - (right ? width(right) + 2 : 0) - 1);
    return `${head} ${faint('─'.repeat(fill))}${right ? ' ' + right : ''}`;
}

function badge(name: string): string {
    const color = hex(BADGE_COLORS[name.toLowerCase()] ?? '#3d444d');
    const textColor: RGB = isLight(color) ? [13, 17, 23] : [255, 255, 255];
    return bg(color)(fg(textColor).bold(` ${name} `));
}

/** Packs badges into lines no wider than `w`. */
function badgeLines(stack: string[], w: number): string[] {
    const lines: string[] = [];
    let line = '';
    for (const item of stack) {
        const b = badge(item);
        if (line && width(line) + 1 + width(b) > w) {
            lines.push(line);
            line = b;
        } else {
            line = line ? `${line} ${b}` : b;
        }
    }
    if (line) lines.push(line);
    return lines;
}

/** Puts `right` at the end of a line of width `w`, after `left`. */
function spread(left: string, right: string, w: number): string {
    return left + ' '.repeat(Math.max(1, w - width(left) - width(right))) + right;
}

function front(p: Profile, iw: number, version: string): string[] {
    const wide = iw >= 60;
    const indent = 3;
    const rightCol = wide ? 23 : indent;
    const rw = iw - rightCol - 2;

    // "GANESH ANGADI" -> "G A N E S H   A N G A D I"
    const spacedName = Array.from(p.name.toUpperCase()).join(' ');
    const name = width(spacedName) <= rw
        ? gradient(spacedName, THEME.borderFrom, THEME.borderTo, true)
        : gradient(truncate(p.name.toUpperCase(), rw), THEME.borderFrom, THEME.borderTo, true);

    const link = (label: string, value: string) => `${dim(label.padEnd(6))}${text(truncate(value, rw - 6))}`;
    const info = [
        name,
        text(truncate(p.role, rw)),
        fg(THEME.violet)('━━━') + faint('━'.repeat(Math.min(21, rw - 3))),
        '',
        link('web', displayUrl(p.links.portfolio)),
        link('git', displayUrl(p.links.github)),
        link('in', displayUrl(p.links.linkedin).replace(/^www\./, '')),
        link('mail', p.email),
    ];

    const rows: string[] = Array(INNER_HEIGHT).fill('');
    const top = 2;
    if (wide) {
        const tile = renderPixels(monogram(initials(p.name), THEME.borderFrom, THEME.borderTo), THEME.card);
        for (let i = 0; i < 8; i++) {
            rows[top + i] = ' '.repeat(indent) + tile[i] + ' '.repeat(rightCol - indent - 16) + (info[i] ?? '');
        }
    } else {
        info.forEach((line, i) => (rows[top + i] = ' '.repeat(indent) + line));
    }

    const quote = chalk.italic(dim(`"${p.quote}"`));
    const cmd = dim('$ ') + fg(THEME.cyan)(`npx ${p.githubUser}`);
    const footer = width(quote) + width(cmd) + 4 <= iw - indent * 2
        ? spread(quote, cmd, iw - indent * 2)
        : quote;
    rows[12] = ' '.repeat(indent) + footer;
    rows[13] = ' '.repeat(iw - version.length - 2 - indent) + faint(`v${version}`);
    return rows;
}

function back(p: Profile, iw: number, live: LiveData | null, loading: boolean): string[] {
    const indent = 3;
    const w = iw - indent * 2;
    const pad = ' '.repeat(indent);
    const rows: string[] = [''];

    rows.push(pad + heading('STACK', w));
    for (const line of badgeLines(p.stack, w).slice(0, 2)) rows.push(pad + line);
    rows.push('');

    const building = live?.building ?? p.building;
    rows.push(pad + heading('NOW BUILDING', w));
    const desc = building.description ? dim('  ·  ' + truncate(building.description, Math.max(0, w - building.title.length - 5))) : '';
    rows.push(pad + text.bold(building.title) + desc);
    rows.push('');

    const gh = live?.github;
    const stats = gh ? dim(`${gh.publicRepos} repos · `) + fg(THEME.star)(`★ ${gh.totalStars}`) : '';
    rows.push(pad + heading('RECENTLY PUSHED', w, stats));
    if (gh && gh.recent.length) {
        for (const r of gh.recent.slice(0, 3)) {
            const stars = r.stars ? fg(THEME.star)(` ★${r.stars}`) : '';
            const left = text(truncate(r.name, w - 16)) + stars;
            rows.push(pad + spread(left, dim(timeAgo(r.pushedAt)), w));
        }
    } else {
        rows.push(pad + dim(loading ? 'fetching from GitHub…' : `see ${displayUrl(p.links.github)}`));
    }

    while (rows.length < INNER_HEIGHT - 1) rows.push('');
    rows.push(' '.repeat(Math.max(0, iw - indent - 13)) + faint('flip ↺ space'));
    return rows.slice(0, INNER_HEIGHT);
}

let qrCache: { url: string; lines: string[] } | null = null;

function qrLines(url: string): string[] {
    if (qrCache?.url === url) return qrCache.lines;
    let out = '';
    qrcode.generate(url, { small: true }, s => (out = s));
    const lines = out.split('\n').filter(l => l.trim().length > 0);
    qrCache = { url, lines };
    return lines;
}

function qrSide(p: Profile, iw: number): string[] {
    const qr = qrLines(p.links.portfolio);
    const qrWidth = Math.max(...qr.map(l => Array.from(l).length));
    const indent = 3;
    const textCol = indent + qrWidth + 4;
    const tw = iw - textCol - 2;
    const top = Math.max(0, Math.floor((INNER_HEIGHT - qr.length) / 2));
    const side = tw >= 18
        ? ['', '', '', fg(THEME.violet).bold('SCAN ME'), '', text('Opens my portfolio'), text('on your phone.'), '', fg(THEME.cyan)(truncate(displayUrl(p.links.portfolio), tw)), '', '', dim('any key to go back')]
        : [];

    const rows: string[] = Array(INNER_HEIGHT).fill('');
    for (let i = 0; i < INNER_HEIGHT; i++) {
        const q = qr[i - top];
        const left = q ? fg([255, 255, 255])(q.padEnd(qrWidth)) : ' '.repeat(qrWidth);
        rows[i] = ' '.repeat(indent) + left + ' '.repeat(4) + (side[i] ?? '');
    }
    return rows;
}

/** Wraps inner rows in the card background and a diagonal gradient border. */
function frame(inner: string[], outerWidth: number, fill = true): string[] {
    const iw = outerWidth - 2;
    const h = inner.length + 2;
    const at = (x: number, y: number) =>
        fg(mix(THEME.borderFrom, THEME.borderTo, (x / Math.max(1, outerWidth - 1)) * 0.75 + (y / Math.max(1, h - 1)) * 0.25));

    const horizontal = (y: number, left: string, right: string) => {
        let line = at(0, y)(left);
        for (let x = 1; x < outerWidth - 1; x++) line += at(x, y)('─');
        return line + at(outerWidth - 1, y)(right);
    };

    const lines = [horizontal(0, '╭', '╮')];
    inner.forEach((row, i) => {
        const y = i + 1;
        const body = fill ? padEnd(row, iw) : ' '.repeat(iw);
        lines.push(at(0, y)('│') + bg(THEME.card)(body) + at(outerWidth - 1, y)('│'));
    });
    lines.push(horizontal(h - 1, '╰', '╯'));
    return lines;
}

export interface RenderInput {
    profile: Profile;
    version: string;
    live: LiveData | null;
    loading: boolean;
    columns: number;
}

export function renderSide(side: Side, input: RenderInput): string[] {
    const { width: w, margin } = layout(input.columns);
    const iw = w - 2;
    const inner = side === 'front'
        ? front(input.profile, iw, input.version)
        : side === 'back'
            ? back(input.profile, iw, input.live, input.loading)
            : qrSide(input.profile, iw);
    return frame(inner, w).map(l => ' '.repeat(margin) + l);
}

/**
 * One frame of the flip: an empty card squeezed to `fraction` of its width, centred where the
 * full card sits. 0 is edge-on.
 */
export function renderFlipFrame(fraction: number, columns: number): string[] {
    const { width: w, margin } = layout(columns);
    const fw = Math.max(2, Math.round(w * fraction));
    const offset = margin + Math.floor((w - fw) / 2);
    const inner = Array(INNER_HEIGHT).fill('');
    return frame(inner, fw, false).map(l => ' '.repeat(offset) + l);
}

export function renderFooter(columns: number, status: string): string[] {
    const { width: w, margin } = layout(columns);
    const key = (k: string, label: string) => fg(THEME.cyan).bold(k) + ' ' + dim(label);
    const groups = [
        [key('space', 'flip'), key('p', 'portfolio'), key('g', 'github'), key('l', 'linkedin'), key('r', 'resume')],
        [key('m', 'mail'), key('c', 'copy email'), key('v', 'vCard'), key('s', 'QR'), key('?', 'surprise'), key('q', 'quit')],
    ];
    const sep = faint(' · ');
    const lines: string[] = [];
    for (const g of groups) {
        // Fall back to fewer items per line on narrow terminals.
        let line = '';
        for (const item of g) {
            const next = line ? line + sep + item : item;
            if (width(next) > w - 4 && line) {
                lines.push(line);
                line = item;
            } else {
                line = next;
            }
        }
        lines.push(line);
    }
    // Line up with the text inside the card (border + 3-space indent).
    const align = (l: string) => ' '.repeat(margin + 4) + l;
    return ['', ...lines.map(align), status ? align(status) : ''];
}

/** The card as plain text, for --plain and non-terminal output. */
export function renderPlain(p: Profile, live: LiveData | null): string {
    const building = live?.building ?? p.building;
    const gh = live?.github;
    const lines = [
        p.name.toUpperCase(),
        p.role,
        '',
        `web   ${displayUrl(p.links.portfolio)}`,
        `git   ${displayUrl(p.links.github)}`,
        `in    ${displayUrl(p.links.linkedin)}`,
        `mail  ${p.email}`,
        '',
        `STACK         ${p.stack.join(' · ')}`,
        `NOW BUILDING  ${building.title}${building.description ? ' — ' + building.description : ''}`,
    ];
    if (gh) {
        lines.push(`GITHUB        ${gh.publicRepos} repos · ★ ${gh.totalStars}`);
        for (const r of gh.recent) lines.push(`              ${r.name}${r.stars ? ` ★${r.stars}` : ''} · ${timeAgo(r.pushedAt)}`);
    }
    lines.push('', `"${p.quote}"`, `$ npx ${p.githubUser}`);

    const w = Math.max(...lines.map(l => Array.from(l).length)) + 4;
    const out = ['╭' + '─'.repeat(w - 2) + '╮'];
    for (const l of ['', ...lines, '']) out.push('│ ' + l + ' '.repeat(w - 3 - Array.from(l).length) + '│');
    out.push('╰' + '─'.repeat(w - 2) + '╯');
    return out.join('\n');
}
