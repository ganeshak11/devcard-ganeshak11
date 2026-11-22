# 👨‍💻 @ganeshak11/devcard

A sleek, interactive, and fully-featured personal business card built for the terminal. 

This CLI tool serves as a digital identity card, showcasing my bio, technical skills, and contact links in a beautifully animated `boxen` layout complete with an interactive command palette and a scannable QR code!

## 🚀 Quick Start

You can run the DevCard instantly without installing anything using `npx`:

```bash
npx ganeshak11
```

## ✨ Features

- **Beautiful UI**: Built using `boxen` and `chalk` for a clean, colorful, and responsive terminal layout.
- **Interactive Command Palette**: Type to search or use the arrow keys. Search also matches each item's description.
- **Live data**: Repo count, total stars and the three most recently pushed repos come straight from the GitHub API (with a short timeout, so the card never hangs).
- **Latest Projects**: Recently pushed repos with descriptions and links.
- **Copy Contact**: Copies the email or a link to your clipboard (`pbcopy`, `clip`, `wl-copy`, `xclip` or `xsel`, with an OSC 52 fallback for terminals over SSH).
- **Save vCard**: Saves a `.vcf` contact card to your Downloads folder.
- **Run Fortis HealthCheck**: Checks any domain with [`@fortis-tools/healthcheck`](https://github.com/Fortis-Tools/healthcheck) without leaving the card.
- **Scannable QR Code**: Scan the terminal with your phone to instantly visit my portfolio site using `qrcode-terminal`.
- **Non-interactive mode**: `--plain` prints the card as text and `--json` prints the profile, for piping and READMEs. When the output isn't a terminal, `--plain` is used automatically.

## 🎛️ Options

| Flag | What it does |
|---|---|
| `--plain` | Print the card as plain text and exit |
| `--json` | Print the profile (plus live GitHub data) as JSON and exit |
| `--no-anim` | Skip the start-up spinner |
| `--offline` | Don't fetch live data from GitHub |
| `--version` | Print the version |
| `--help` | Show the options |

```bash
npx ganeshak11 --plain > card.txt
npx ganeshak11 --json | jq .links
```

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
- [Inquirer.js](https://github.com/SBoudrias/Inquirer.js/) - For the interactive prompt
- [Boxen](https://github.com/sindresorhus/boxen) - For the sleek borders
- [Chalk](https://github.com/chalk/chalk) - For terminal string styling
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
