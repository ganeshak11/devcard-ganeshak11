import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Profile } from './profile.js';

const escape = (s: string) => s.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');

export function buildVCard(p: Profile): string {
    const parts = p.name.trim().split(/\s+/);
    const last = parts.length > 1 ? parts[parts.length - 1] : '';
    const first = parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0];
    return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${escape(last)};${escape(first)};;;`,
        `FN:${escape(p.name)}`,
        `TITLE:${escape(p.role)}`,
        `EMAIL;TYPE=INTERNET:${p.email}`,
        `URL:${p.links.portfolio}`,
        `URL;TYPE=GitHub:${p.links.github}`,
        `URL;TYPE=LinkedIn:${p.links.linkedin}`,
        `NOTE:${escape(p.quote)}`,
        'END:VCARD',
        '',
    ].join('\r\n');
}

/** Writes the vCard to ~/Downloads (or the current folder when that doesn't exist) without overwriting anything. */
export function saveVCard(p: Profile): string {
    const downloads = path.join(os.homedir(), 'Downloads');
    const dir = fs.existsSync(downloads) ? downloads : process.cwd();
    const base = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'contact';
    let file = path.join(dir, `${base}.vcf`);
    for (let i = 2; fs.existsSync(file); i++) file = path.join(dir, `${base}-${i}.vcf`);
    fs.writeFileSync(file, buildVCard(p), { flag: 'wx' });
    return file;
}
