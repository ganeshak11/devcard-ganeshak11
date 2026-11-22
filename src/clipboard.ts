import { spawn } from 'node:child_process';
import process from 'node:process';

/** Clipboard commands to try, in order, for this platform. */
function candidates(): [string, string[]][] {
    if (process.platform === 'darwin') return [['pbcopy', []]];
    if (process.platform === 'win32') return [['clip', []]];
    const list: [string, string[]][] = [];
    if (process.env.WAYLAND_DISPLAY) list.push(['wl-copy', []]);
    list.push(['xclip', ['-selection', 'clipboard']], ['xsel', ['--clipboard', '--input']]);
    return list;
}

function tryCommand(cmd: string, args: string[], text: string): Promise<boolean> {
    return new Promise(resolve => {
        const child = spawn(cmd, args, { stdio: ['pipe', 'ignore', 'ignore'] });
        child.on('error', () => resolve(false));
        child.on('close', code => resolve(code === 0));
        child.stdin.end(text);
    });
}

/**
 * Copies text to the clipboard. Falls back to the OSC 52 escape sequence, which many terminals
 * (including over SSH) turn into a clipboard write.
 * Returns 'native', 'osc52' or false.
 */
export async function copyToClipboard(text: string): Promise<'native' | 'osc52' | false> {
    for (const [cmd, args] of candidates()) {
        if (await tryCommand(cmd, args, text)) return 'native';
    }
    if (process.stdout.isTTY) {
        process.stdout.write(`\x1b]52;c;${Buffer.from(text).toString('base64')}\x07`);
        return 'osc52';
    }
    return false;
}
