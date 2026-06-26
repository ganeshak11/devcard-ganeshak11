#!/usr/bin/env node

import process from 'node:process';
import os from 'node:os';
import boxen from 'boxen';
import chalk from 'chalk';
import qrcode from 'qrcode-terminal';
import search from '@inquirer/search';
import open from 'open';
import ora from 'ora';

// 1. Data Structure
const getResponsiveName = () => {
    const cols = process.stdout.columns || 80;
    if (cols < 65) {
        return chalk.bold.greenBright("          GANESH ANGADI");
    }
    return chalk.bold.greenBright(`  ██████╗  █████╗ ███╗   ██╗███████╗███████╗██╗  ██╗
 ██╔════╝ ██╔══██╗████╗  ██║██╔════╝██╔════╝██║  ██║
 ██║  ███╗███████║██╔██╗ ██║█████╗  ███████╗███████║
 ██║   ██║██╔══██║██║╚██╗██║██╔══╝  ╚════██║██╔══██║
 ╚██████╔╝██║  ██║██║ ╚████║███████╗███████║██║  ██║
  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝╚═╝  ╚═╝`);
};

const data = {
    name: getResponsiveName(),
    role: chalk.yellow("DevOps Engineer & System Architect"),
    github: chalk.cyan("@ganeshak11"),
    portfolio: chalk.cyan("ganeshangadi.online"),
    quote: chalk.gray('"Infrastructure should heal itself."')
};

// 2. Setup System Info
const platformNames: Record<string, string> = {
    win32: 'Windows',
    darwin: 'macOS',
    linux: 'Linux'
};
const platform = platformNames[os.platform()] || os.platform();
const systemInfo = `Platform : ${platform} ${os.release()}
Node     : ${process.version}
Terminal : ${process.env.TERM || 'Unknown'}`;

// 3. Setup Layout Text
const output = `
${data.name}

${chalk.bold("Role:")}      ${data.role}
${chalk.bold("GitHub:")}    ${data.github}
${chalk.bold("Portfolio:")} ${data.portfolio}

${chalk.bold("Core Stack")}
• Docker                • Kubernetes
• Terraform             • AWS
• GitHub Actions        • Linux 
• Git                   

${chalk.bold("Building")}
Fortis-CI
Graph-native deployment observability

${systemInfo}

${data.quote}
`;

// 4. Main function
async function main() {
    console.clear();

    // Animation
    const spinner = ora('Initializing profile...').start();
    await new Promise(resolve => setTimeout(resolve, 600));
    spinner.stop();
    console.clear();

    // Boxed Output
    const card = boxen(output, {
        padding: 1,
        margin: 1,
        borderStyle: "double",
        borderColor: "yellow",
        title: "v2.1.0",
        titleAlignment: "right"
    });

    console.log(card);

    // System Personality Greeting
    console.log(chalk.gray(`\nRunning on ${platform}...\n`));

    // The Command Palette Loop
    while (true) {
        const choices = [
            { name: '❯ Open Portfolio', value: 'portfolio', description: 'Opens ganeshangadi.online' },
            { name: '  View GitHub', value: 'github', description: 'Opens github.com/ganeshak11' },
            { name: '  Show QR Code', value: 'qrcode', description: 'Scan to view on mobile' },
            { name: '  Mail', value: 'email', description: 'Say hello!' },
            { name: '  Download Resume', value: 'resume', description: 'View my resume' },
            { name: '  Surprise Me', value: 'easteregg', description: 'A little secret for you...' },
            { name: '  Exit', value: 'quit', description: 'Exit the CLI' },
        ];

        const answer = await search({
            message: 'Command Palette (Type to search or use arrow keys):',
            source: async (input, { signal }) => {
                if (!input) return choices;
                return choices.filter(choice => choice.name.toLowerCase().includes(input.toLowerCase()));
            }
        });

        if (answer === 'portfolio') {
            console.log(chalk.green('\n✔ Browser launched.'));
            await open('https://ganeshangadi.online');
            console.log(chalk.gray('Returning to terminal...\n'));
        } else if (answer === 'github') {
            console.log(chalk.green('\n✔ Browser launched.'));
            await open('https://github.com/ganeshak11');
            console.log(chalk.gray('Returning to terminal...\n'));
        } else if (answer === 'resume') {
            console.log(chalk.green('\n✔ Browser launched.'));
            await open('https://ganeshangadi.online/Resume/ganesh-angadi-resume.pdf'); // Fallback placeholder
            console.log(chalk.gray('Returning to terminal...\n'));
        } else if (answer === 'email') {
            console.log(chalk.green('\n✔ Opening your email client...'));
            await open('mailto:ganeshangadi13012006@gmail.com');
            console.log(chalk.gray('Returning to terminal...\n'));
        } else if (answer === 'qrcode') {
            console.log(chalk.bold.cyan("\nScan to visit my portfolio:\n"));
            qrcode.generate("https://ganeshangadi.online", { small: true });
            console.log('\n');
        } else if (answer === 'easteregg') {
            const jokes = [
                "GITHUB_STATS",
                "Infrastructure is not magic — it's decisions with trade-offs.",
                "Exit codes are not enough. Add health checks.",
                "If it's not in version control, it doesn't exist.",
                "A deploy without a tested rollback is a gamble.",
                "I use Linux btw 😎",
                "There is no cloud, just someone else's computer.",
                "It works on my machine ¯\\_(ツ)_/¯",
                "Monitoring is not optional—it's insurance.",
                "Every outage teaches what docs can't.",
                "Logs are your conversation with the past.",
                "Automation is just scripting with accountability.",
                "Containers don’t remove complexity. They relocate it.",
                "The bug was free. The downtime wasn’t.",
                "A server without monitoring is a horror movie in slow motion.",
                "SSH into prod enough times and eventually prod SSHs into your soul.",
                "Backups are Schrödinger’s feature until restore is tested.",
                "Scale exposes architecture lies.",
                "If your infra diagram looks clean, it’s outdated.",
                "Every sudo rm -rf starts with confidence.",
                "YAML: where one space can destroy civilizations.",
                "Kubernetes is what happens when engineers fear simplicity.",
                "CI/CD without tests is just faster failure delivery.",
                "The database remembers every bad decision.",
                "Caching fixes performance and creates philosophy debates.",
                "A 99.9% uptime SLA still allows chaos. Humans love decimals.",
                "Temporary fixes have excellent survival rates.",
                "Your future self is the real DevOps customer.",
                "Permissions are easy until production says otherwise.",
                "Infra as Code means your mistakes are now reproducible.",
                "If alerts fire for everything, they matter for nothing.",
                "The best optimization is deleting unnecessary systems.",
                "Docker didn’t solve dependency hell. It containerized it.",
                "Every manual step becomes tomorrow’s incident report.",
                "Distributed systems are just computers refusing teamwork.",
                "You don’t own uptime. You rent it from reality.",
                "The more dashboards you have, the less anyone reads them.",
                "A restart is not a root cause analysis.",
                "Latency is just distance charging interest.",
                "An unpatched server is basically a public challenge.",
                "Real engineers fear silent failures more than loud crashes."
            ];
            const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];

            if (randomJoke === "GITHUB_STATS") {
                try {
                    const res = await fetch('https://api.github.com/users/ganeshak11');
                    const data = await res.json();
                    console.log(chalk.bold.magenta(`\nToday's GitHub Stats\nPublic Repositories: ${data.public_repos}\nFollowers: ${data.followers}\n`));
                } catch (e) {
                    console.log(chalk.bold.magenta('\nGitHub is down... typical. 🤷‍♂️\n'));
                }
            } else {
                console.log(chalk.bold.magenta('\n' + randomJoke + '\n'));
            }
        } else {
            console.log(chalk.gray('\nMission accomplished. Thanks for checking out my work.'));
            console.log(chalk.bold.green('Happy Visiting. 👋\n'));
            process.exit(0);
        }
    }
}

main().catch(console.error);
