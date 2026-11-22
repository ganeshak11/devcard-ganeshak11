# 👨‍💻 ganeshak11 — a developer's visiting card

A flippable business card for the terminal. Run it, flip it over with <kbd>space</kbd>, and reach me in one keypress.

## 🚀 Quick Start

You can run the DevCard instantly without installing anything using `npx`:

```bash
npx ganeshak11
```

## ✨ What you get

A developer's visiting card, drawn in truecolor right in your terminal.

- **Front:** a pixel-art monogram tile, my name in a gradient, role, and where to find me.
- **Back:** press <kbd>space</kbd> and the card flips over to show my stack as brand-colored badges, what I'm building now, and my most recently pushed repos, live from GitHub.
- **QR side:** press <kbd>s</kbd> for a scannable QR code to my portfolio.
- **One-key actions** instead of menus. It fits an 80×24 terminal, and narrow terminals get a compact layout.

| Key | Action |
|---|---|
| <kbd>space</kbd> / <kbd>←</kbd> <kbd>→</kbd> | Flip the card |
| <kbd>p</kbd> <kbd>g</kbd> <kbd>l</kbd> <kbd>r</kbd> | Open portfolio, GitHub, LinkedIn, resume |
| <kbd>m</kbd> | Write me an email |
| <kbd>c</kbd> | Copy my email to your clipboard |
| <kbd>v</kbd> | Save my contact card (`.vcf`) to your Downloads folder |
| <kbd>s</kbd> | Show a QR code |
| <kbd>?</kbd> | A random DevOps one-liner |
| <kbd>q</kbd> / <kbd>esc</kbd> | Quit (the card stays on screen) |

## 🎛️ Options

| Flag | What it does |
|---|---|
| `--plain` | Print the card as plain text and exit (automatic when the output isn't a terminal) |
| `--json` | Print the profile, plus live GitHub data, as JSON and exit |
| `--no-anim` | Skip the deal-in and flip animations |
| `--offline` | Don't fetch live data from GitHub |
| `--version` | Print the version |
| `--help` | Show the options and keys |

```bash
npx ganeshak11 --plain > card.txt
npx ganeshak11 --json | jq .links
```

Colors are 24-bit and degrade automatically on terminals with fewer colors.

## ✏️ Editing the card

The bio, links, stack and "Building" line live in [`profile.json`](profile.json), so changing the card means editing data, not code. The same file can feed the portfolio site.

To change "Building" without publishing a new version, host a JSON file such as
`{"building": {"title": "Fortis-CI", "description": "Graph-native deployment observability"}}`
and set `nowUrl` in `profile.json` to its URL. The card falls back to the `building` value in `profile.json` when the URL can't be reached.

## 🚢 Releasing

Pushing a tag like `v2.2.0` runs [`.github/workflows/publish.yml`](.github/workflows/publish.yml): it checks the tag matches `package.json`, builds, smoke-tests and publishes to npm. It needs an `NPM_TOKEN` repository secret.

```bash
npm version minor
git push --follow-tags
```

## 🛠️ Built With

- [TypeScript](https://www.typescriptlang.org/)
- [Chalk](https://github.com/chalk/chalk) - For truecolor styling
- Node's `readline` keypress events for the one-key controls; the card, border gradient and pixel art are drawn by hand (`src/card.ts`, `src/pixels.ts`)
- [QRCode-Terminal](https://github.com/gtanner/qrcode-terminal) - For rendering the QR code

## 📦 Local Development

If you want to clone this repo and run it locally:

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Compile the TypeScript:
   ```bash
   npm run build
   ```
4. Run the CLI:
   ```bash
   npm start
   ```

---
*Built as part of the Fortis-Tools DevOps toolkit.*
