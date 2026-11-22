#!/usr/bin/env node

import process from 'node:process';
import { spawn } from 'node:child_process';
import boxen from 'boxen';
import chalk from 'chalk';
import qrcode from 'qrcode-terminal';
import search from '@inquirer/search';
import { input, select } from '@inquirer/prompts';
import open from 'open';
import ora from 'ora';
import { pkg, profile, displayUrl } from './profile.js';
import { fetchGitHub, fetchLive, timeAgo, type LiveData } from './live.js';
import { renderCard, platform } from './card.js';
import { copyToClipboard } from './clipboard.js';
import { saveVCard } from './vcard.js';

const HELP = `
Usage: npx ganeshak11 [options]

  --plain      Print the card as plain text and exit (also used automatically when not in a terminal)
  --json       Print the profile as JSON and exit
  --no-anim    Skip the start-up spinner
  --offline    Don't fetch live GitHub data
  --version    Print the version
  --help       Show this help
`;

const args = new Set(process.argv.slice(2));
for (const a of args) {
    if (!['--plain', '--json', '--no-anim', '--offline', '--version', '-v', '--help', '-h'].includes(a)) {
        console.error(`Unknown option: ${a}\n${HELP}`);
        process.exit(1);
    }
}
const interactive = Boolean(process.stdout.isTTY && process.stdin.isTTY);
const flags = {
    help: args.has('--help') || args.has('-h'),
    version: args.has('--version') || args.has('-v'),
    json: args.has('--json'),
    plain: args.has('--plain') || !interactive,
    noAnim: args.has('--no-anim'),
    offline: args.has('--offline'),
};

const LIVE_TIMEOUT_MS = 1500;

/**
 * ora divides by stdout.columns to count the lines it must clear. Some ptys (IDE and agent
 * terminals, some CI runners) report 0 columns, which makes that Infinity: ora then writes
 * "cursor up + clear line" forever and the buffered output grows by gigabytes.
 */
const spinnerSafe = () => Boolean(process.stdout.isTTY && (process.stdout.columns ?? 0) > 0);
const DOMAIN_RE = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
const cleanDomain = (v: string) => v.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '');

async function loadLive(timeoutMs: number): Promise<LiveData | null> {
    if (flags.offline) return null;
    return fetchLive(profile.githubUser, profile.nowUrl, timeoutMs);
}

const JOKES = [
    'GITHUB_STATS',
    "Infrastructure is not magic — it's decisions with trade-offs.",
    'Exit codes are not enough. Add health checks.',
    "If it's not in version control, it doesn't exist.",
    'A deploy without a tested rollback is a gamble.',
    'I use Linux btw 😎',
    "There is no cloud, just someone else's computer.",
    'It works on my machine ¯\\_(ツ)_/¯',
    "Monitoring is not optional—it's insurance.",
    "Every outage teaches what docs can't.",
    'Logs are your conversation with the past.',
    'Automation is just scripting with accountability.',
    'Containers don’t remove complexity. They relocate it.',
    'The bug was free. The downtime wasn’t.',
    'A server without monitoring is a horror movie in slow motion.',
    'SSH into prod enough times and eventually prod SSHs into your soul.',
    'Backups are Schrödinger’s feature until restore is tested.',
    'Scale exposes architecture lies.',
    'If your infra diagram looks clean, it’s outdated.',
    'Every sudo rm -rf starts with confidence.',
    'YAML: where one space can destroy civilizations.',
    'Kubernetes is what happens when engineers fear simplicity.',
    'CI/CD without tests is just faster failure delivery.',
    'The database remembers every bad decision.',
    'Caching fixes performance and creates philosophy debates.',
    'A 99.9% uptime SLA still allows chaos. Humans love decimals.',
    'Temporary fixes have excellent survival rates.',
    'Your future self is the real DevOps customer.',
    'Permissions are easy until production says otherwise.',
    'Infra as Code means your mistakes are now reproducible.',
    'If alerts fire for everything, they matter for nothing.',
    'The best optimization is deleting unnecessary systems.',
    'Docker didn’t solve dependency hell. It containerized it.',
    'Every manual step becomes tomorrow’s incident report.',
    'Distributed systems are just computers refusing teamwork.',
    'You don’t own uptime. You rent it from reality.',
    'The more dashboards you have, the less anyone reads them.',
    'A restart is not a root cause analysis.',
    'Latency is just distance charging interest.',
    'An unpatched server is basically a public challenge.',
    'Real engineers fear silent failures more than loud crashes.',
];

async function openLink(url: string, message = '✔ Browser launched.') {
    console.log(chalk.green(`\n${message}`));
    await open(url);
    console.log(chalk.gray('Returning to terminal...\n'));
}

async function copyContact() {
    const value = await select({
        message: 'Copy what?',
        choices: [
            { name: `Email      ${chalk.gray(profile.email)}`, value: profile.email },
            { name: `Portfolio  ${chalk.gray(profile.links.portfolio)}`, value: profile.links.portfolio },
            { name: `GitHub     ${chalk.gray(profile.links.github)}`, value: profile.links.github },
            { name: `LinkedIn   ${chalk.gray(profile.links.linkedin)}`, value: profile.links.linkedin },
        ],
    });
    const how = await copyToClipboard(value);
    if (how === 'native') console.log(chalk.green(`\n✔ Copied ${value}\n`));
    else if (how === 'osc52') console.log(chalk.green(`\n✔ Sent ${value} to your terminal's clipboard (works in most modern terminals)\n`));
    else console.log(chalk.yellow(`\nNo clipboard available here. Copy it by hand: ${value}\n`));
}

async function showProjects(live: LiveData | null) {
    let gh = live?.github ?? null;
    if (!gh && !flags.offline) {
        const spinner = ora({ text: 'Fetching from GitHub...', isEnabled: spinnerSafe() }).start();
        gh = await fetchGitHub(profile.githubUser).catch(() => null);
        spinner.stop();
    }
    if (!gh) {
        console.log(chalk.yellow(`\nCouldn't reach GitHub. Everything is at ${profile.links.github}\n`));
        return;
    }
    console.log(chalk.bold.cyan(`\nLatest projects  ${chalk.gray(`(${gh.publicRepos} public repos, ★ ${gh.totalStars} total)`)}\n`));
    for (const r of gh.recent) {
        console.log(`${chalk.bold(r.name)}${r.stars ? chalk.yellow(` ★ ${r.stars}`) : ''} ${chalk.gray('· pushed ' + timeAgo(r.pushedAt))}`);
        if (r.description) console.log(`  ${r.description}`);
        console.log(chalk.cyan(`  ${r.url}`));
    }
    console.log('');
}

function runHealthcheck(domain: string): Promise<number | null> {
    return new Promise(resolve => {
        const isWin = process.platform === 'win32';
        // The domain is validated against DOMAIN_RE, so passing it through the Windows shell is safe.
        const child = spawn(isWin ? 'npx.cmd' : 'npx', ['-y', '@fortis-tools/healthcheck', domain], { stdio: 'inherit', shell: isWin });
        // Let Ctrl+C stop the scan without killing the card.
        const ignore = () => {};
        process.on('SIGINT', ignore);
        const done = (code: number | null) => {
            process.off('SIGINT', ignore);
            resolve(code);
        };
        child.on('error', () => done(null));
        child.on('close', done);
    });
}

async function healthcheck() {
    const domain = cleanDomain(await input({
        message: 'Domain to check:',
        default: displayUrl(profile.links.portfolio),
        validate: v => DOMAIN_RE.test(cleanDomain(v)) || 'Enter a domain like example.com',
    }));

    console.log(chalk.gray(`\nRunning npx @fortis-tools/healthcheck ${domain} ...\n`));
    const code = await runHealthcheck(domain);
    if (code === null) console.log(chalk.red('\nCould not start npx. Is Node/npm on your PATH?\n'));
    else console.log(chalk.gray(`\nHealthCheck finished with exit code ${code}. More at https://github.com/Fortis-Tools/healthcheck\n`));
}

async function surprise() {
    const joke = JOKES[Math.floor(Math.random() * JOKES.length)];
    if (joke !== 'GITHUB_STATS') {
        console.log(chalk.bold.magenta('\n' + joke + '\n'));
        return;
    }
    try {
        const gh = await fetchGitHub(profile.githubUser);
        console.log(chalk.bold.magenta(`\nToday's GitHub Stats\nPublic Repositories: ${gh.publicRepos}\nFollowers: ${gh.followers}\nStars: ${gh.totalStars}\n`));
    } catch {
        console.log(chalk.bold.magenta('\nGitHub is down... typical. 🤷‍♂️\n'));
    }
}

async function main() {
    if (flags.help) {
        console.log(HELP);
        return;
    }
    if (flags.version) {
        console.log(pkg.version);
        return;
    }

    if (flags.json) {
        const live = await loadLive(3000);
        console.log(JSON.stringify({ version: pkg.version, ...profile, live }, null, 2));
        return;
    }

    if (flags.plain) {
        const live = await loadLive(3000);
        console.log(renderCard(profile, { plain: true, live }).trim());
        return;
    }

    console.clear();
    const livePromise = loadLive(LIVE_TIMEOUT_MS);
    let live: LiveData | null;
    if (flags.noAnim) {
        live = await livePromise;
    } else {
        const spinner = ora({ text: 'Initializing profile...', isEnabled: spinnerSafe() }).start();
        // Show the spinner for at least 600 ms; the live fetch runs in the same window.
        [live] = await Promise.all([livePromise, new Promise(resolve => setTimeout(resolve, 600))]);
        spinner.stop();
        console.clear();
    }

    console.log(boxen(renderCard(profile, { plain: false, live }), {
        padding: 1,
        margin: 1,
        borderStyle: 'double',
        borderColor: 'yellow',
        title: `v${pkg.version}`,
        titleAlignment: 'right',
    }));
    console.log(chalk.gray(`\nRunning on ${platform}...\n`));

    const choices = [
        { name: 'Open Portfolio', value: 'portfolio', description: `Opens ${displayUrl(profile.links.portfolio)}` },
        { name: 'View GitHub', value: 'github', description: `Opens ${displayUrl(profile.links.github)}` },
        { name: 'View LinkedIn', value: 'linkedin', description: 'Opens my LinkedIn profile' },
        { name: 'Latest Projects', value: 'projects', description: 'Recently pushed repos, live from GitHub' },
        { name: 'Show QR Code', value: 'qrcode', description: 'Scan to view on mobile' },
        { name: 'Mail', value: 'email', description: 'Say hello!' },
        { name: 'Copy Contact', value: 'copy', description: 'Copy my email or a link to your clipboard' },
        { name: 'Save vCard', value: 'vcard', description: 'Save my contact card (.vcf) to your Downloads folder' },
        { name: 'Download Resume', value: 'resume', description: 'View my resume' },
        { name: 'Run Fortis HealthCheck', value: 'healthcheck', description: 'Check any domain with npx @fortis-tools/healthcheck' },
        { name: 'Surprise Me', value: 'easteregg', description: 'A little secret for you...' },
        { name: 'Exit', value: 'quit', description: 'Exit the CLI' },
    ];

    while (true) {
        const answer = await search({
            message: 'Command Palette (Type to search or use arrow keys):',
            source: async (term) => {
                if (!term) return choices;
                const q = term.toLowerCase();
                return choices.filter(c => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
            },
        });

        switch (answer) {
            case 'portfolio': await openLink(profile.links.portfolio); break;
            case 'github': await openLink(profile.links.github); break;
            case 'linkedin': await openLink(profile.links.linkedin); break;
            case 'resume': await openLink(profile.links.resume); break;
            case 'email': await openLink(`mailto:${profile.email}`, '✔ Opening your email client...'); break;
            case 'projects': await showProjects(live); break;
            case 'copy': await copyContact(); break;
            case 'vcard':
                try {
                    console.log(chalk.green(`\n✔ Saved ${saveVCard(profile)}\n`));
                } catch (e) {
                    console.log(chalk.red(`\nCouldn't save the vCard: ${(e as Error).message}\n`));
                }
                break;
            case 'healthcheck': await healthcheck(); break;
            case 'qrcode':
                console.log(chalk.bold.cyan('\nScan to visit my portfolio:\n'));
                qrcode.generate(profile.links.portfolio, { small: true });
                console.log('\n');
                break;
            case 'easteregg': await surprise(); break;
            case 'quit':
                console.log(chalk.gray('\nMission accomplished. Thanks for checking out my work.'));
                console.log(chalk.bold.green('Happy Visiting. 👋\n'));
                process.exit(0);
        }
    }
}

main().catch((err) => {
    // Ctrl+C inside a prompt rejects with ExitPromptError; treat it as a normal exit.
    if (err instanceof Error && err.name === 'ExitPromptError') {
        console.log(chalk.bold.green('\nHappy Visiting. 👋\n'));
        process.exit(0);
    }
    console.error(err);
    process.exit(1);
});
