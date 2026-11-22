import os from 'node:os';
import process from 'node:process';
import chalk from 'chalk';
import { displayUrl, type Profile } from './profile.js';
import { timeAgo, type LiveData } from './live.js';

const BANNER = `  ██████╗  █████╗ ███╗   ██╗███████╗███████╗██╗  ██╗
 ██╔════╝ ██╔══██╗████╗  ██║██╔════╝██╔════╝██║  ██║
 ██║  ███╗███████║██╔██╗ ██║█████╗  ███████╗███████║
 ██║   ██║██╔══██║██║╚██╗██║██╔══╝  ╚════██║██╔══██║
 ╚██████╔╝██║  ██║██║ ╚████║███████╗███████║██║  ██║
  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝╚═╝  ╚═╝`;

const platformNames: Record<string, string> = { win32: 'Windows', darwin: 'macOS', linux: 'Linux' };
export const platform = platformNames[os.platform()] || os.platform();

/** Lays the stack out in two columns. */
export function stackColumns(stack: string[], width = 22): string {
    const lines: string[] = [];
    for (let i = 0; i < stack.length; i += 2) {
        const left = `• ${stack[i]}`;
        lines.push(stack[i + 1] ? left.padEnd(width) + `• ${stack[i + 1]}` : left);
    }
    return lines.join('\n');
}

export interface CardOptions {
    /** No ASCII-art banner, no system info. Used for --plain and narrow terminals. */
    plain: boolean;
    live: LiveData | null;
}

export function renderCard(p: Profile, opts: CardOptions): string {
    const cols = process.stdout.columns || 80;
    const name = opts.plain || cols < 65
        ? chalk.bold.greenBright(opts.plain ? p.name.toUpperCase() : `          ${p.name.toUpperCase()}`)
        : chalk.bold.greenBright(BANNER);
    const building = opts.live?.building ?? p.building;
    const gh = opts.live?.github;

    const sections = [
        name,
        '',
        `${chalk.bold('Role:')}      ${chalk.yellow(p.role)}`,
        `${chalk.bold('GitHub:')}    ${chalk.cyan('@' + p.githubUser)}${gh ? chalk.gray(`  (${gh.publicRepos} repos, ★ ${gh.totalStars})`) : ''}`,
        `${chalk.bold('Portfolio:')} ${chalk.cyan(displayUrl(p.links.portfolio))}`,
        `${chalk.bold('Email:')}     ${chalk.cyan(p.email)}`,
        '',
        chalk.bold('Core Stack'),
        stackColumns(p.stack),
        '',
        chalk.bold('Building'),
        building.title,
        chalk.gray(building.description),
    ];

    if (gh && gh.recent.length) {
        sections.push('', chalk.bold('Recently Pushed'));
        for (const r of gh.recent) {
            const stars = r.stars ? chalk.yellow(` ★ ${r.stars}`) : '';
            sections.push(`${r.name}${stars} ${chalk.gray('· ' + timeAgo(r.pushedAt))}`);
        }
    }

    if (!opts.plain) {
        sections.push('', `Platform : ${platform} ${os.release()}`, `Node     : ${process.version}`, `Terminal : ${process.env.TERM || 'Unknown'}`);
    }
    sections.push('', chalk.gray(`"${p.quote}"`));
    return '\n' + sections.join('\n') + '\n';
}
