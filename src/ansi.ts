import chalk from 'chalk';

const ANSI_RE = /\x1b\[[0-9;]*m/g;

export const stripAnsi = (s: string) => s.replace(ANSI_RE, '');

/** Visible width. Everything the card draws is single-width (no emoji, no CJK). */
export const width = (s: string) => Array.from(stripAnsi(s)).length;

export function padEnd(s: string, w: number): string {
    const gap = w - width(s);
    return gap > 0 ? s + ' '.repeat(gap) : s;
}

/** Cuts a plain string to `w` characters, ending with … when it had to cut. */
export function truncate(s: string, w: number): string {
    const chars = Array.from(s);
    if (chars.length <= w) return s;
    return w <= 1 ? chars.slice(0, w).join('') : chars.slice(0, w - 1).join('') + '…';
}

export type RGB = [number, number, number];

export function hex(h: string): RGB {
    const n = parseInt(h.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function mix(a: RGB, b: RGB, t: number): RGB {
    const k = Math.min(1, Math.max(0, t));
    return [0, 1, 2].map(i => Math.round(a[i] + (b[i] - a[i]) * k)) as RGB;
}

export const fg = (c: RGB) => chalk.rgb(c[0], c[1], c[2]);
export const bg = (c: RGB) => chalk.bgRgb(c[0], c[1], c[2]);

/** Colors each character of `text` along a gradient. */
export function gradient(text: string, from: RGB, to: RGB, bold = false): string {
    const chars = Array.from(text);
    return chars.map((ch, i) => {
        const style = fg(mix(from, to, chars.length > 1 ? i / (chars.length - 1) : 0));
        return ch === ' ' ? ch : (bold ? style.bold(ch) : style(ch));
    }).join('');
}

/** Relative luminance, to pick dark or light text on a colored badge. */
export function isLight(c: RGB): boolean {
    const [r, g, b] = c.map(v => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45;
}
