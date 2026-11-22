import { bg, fg, mix, type RGB } from './ansi.js';

/** 5×7 capital letters. '#' is a lit pixel. */
const FONT: Record<string, string[]> = {
    A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
    C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
    D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
    E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
    F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
    G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.###.'],
    H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    I: ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
    J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
    K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
    L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
    M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
    N: ['#...#', '#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#'],
    O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
    Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
    R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
    S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
    T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
    U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
    W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '#.#.#', '.#.#.'],
    X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
    Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
    Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
};

/** A pixel grid: null is transparent. */
export type Pixels = (RGB | null)[][];

/** Draws pixels with half blocks: each terminal cell shows two stacked pixels. */
export function renderPixels(px: Pixels, transparent: RGB): string[] {
    const rows: string[] = [];
    for (let y = 0; y < px.length; y += 2) {
        let line = '';
        for (let x = 0; x < px[y].length; x++) {
            const top = px[y][x] ?? transparent;
            const bottom = px[y + 1]?.[x] ?? transparent;
            line += bg(bottom)(fg(top)('▀'));
        }
        rows.push(line);
    }
    return rows;
}

export function initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).map(w => w[0].toUpperCase()).filter(c => FONT[c]).slice(0, 2).join('') || '?';
}

/**
 * A square app-icon style tile: a diagonal gradient with rounded corners and the initials
 * knocked out in white. `size` is in pixels; the result is `size` columns by size/2 rows.
 */
export function monogram(text: string, from: RGB, to: RGB, size = 16): Pixels {
    const px: Pixels = [];
    const r = 2; // corner radius in pixels
    for (let y = 0; y < size; y++) {
        const row: (RGB | null)[] = [];
        for (let x = 0; x < size; x++) {
            const dx = x < r ? r - x : x > size - 1 - r ? x - (size - 1 - r) : 0;
            const dy = y < r ? r - y : y > size - 1 - r ? y - (size - 1 - r) : 0;
            const outside = dx > 0 && dy > 0 && dx * dx + dy * dy > r * r;
            row.push(outside ? null : mix(from, to, (x + y) / (2 * (size - 1))));
        }
        px.push(row);
    }

    const glyphs = Array.from(text).map(c => FONT[c]).filter(Boolean);
    const textWidth = glyphs.length * 5 + (glyphs.length - 1);
    const x0 = Math.floor((size - textWidth) / 2);
    const y0 = Math.floor((size - 7) / 2);
    const white: RGB = [255, 255, 255];
    glyphs.forEach((g, i) => {
        g.forEach((line, gy) => {
            Array.from(line).forEach((ch, gx) => {
                if (ch === '#') px[y0 + gy][x0 + i * 6 + gx] = white;
            });
        });
    });
    return px;
}
