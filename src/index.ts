#!/usr/bin/env node

import process from 'node:process';
import { runApp } from './app.js';
import { renderPlain } from './card.js';
import { fetchLive } from './live.js';
import { pkg, profile } from './profile.js';

const HELP = `
Usage: npx ${profile.githubUser} [options]

  --plain      Print the card as plain text and exit (used automatically when not in a terminal)
  --json       Print the profile as JSON and exit
  --no-anim    Skip the animations
  --offline    Don't fetch live data from GitHub
  --version    Print the version
  --help       Show this help

Keys: space flip · p portfolio · g github · l linkedin · r resume · m mail
      c copy email · v save vCard · s QR code · ? surprise · q quit
`;

const KNOWN = ['--plain', '--json', '--no-anim', '--offline', '--version', '-v', '--help', '-h'];
const args = new Set(process.argv.slice(2));
for (const a of args) {
    if (!KNOWN.includes(a)) {
        console.error(`Unknown option: ${a}\n${HELP}`);
        process.exit(1);
    }
}

const has = (...names: string[]) => names.some(n => args.has(n));
const interactive = Boolean(process.stdout.isTTY && process.stdin.isTTY);
const offline = has('--offline');
const live = () => (offline ? Promise.resolve(null) : fetchLive(profile.githubUser, profile.nowUrl, 3000));

async function main() {
    if (has('--help', '-h')) return console.log(HELP);
    if (has('--version', '-v')) return console.log(pkg.version);
    if (has('--json')) return console.log(JSON.stringify({ version: pkg.version, ...profile, live: await live() }, null, 2));
    if (has('--plain') || !interactive) return console.log(renderPlain(profile, await live()));
    await runApp({ animate: !has('--no-anim'), offline });
}

main().catch(err => {
    process.stdout.write('\x1b[?25h');
    console.error(err);
    process.exit(1);
});
