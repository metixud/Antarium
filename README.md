# Antarium

Antarium is a basic obfuscator for JavaScript and Node.js.

## Install

```bash
npm install
```

## Usage

```bash
node antarium.js <input> <output> [-p low|medium|high]
```

Examples:

```bash
node antarium.js ./src ./build
node antarium.js ./app.js -o ./dist -p high
node antarium.js ./site -o ./obf --antidebug --antidebug-redirect https://metixud.xyz
```

## Options

- `-o, --output <dir>` — output folder (default `./antarium-output`)
- `-p, --preset <level>` — `low`, `medium`, `high` (default `medium`)
- `-e, --ext <list>` — extensions to process, e.g. `.js,.html`
- `--seed <n>` — reproducible output
- `-a, --antidebug` — inject devtools detection
- `--antidebug-action <a>` — `loop` | `blank` | `redirect` | `reload`
- `--antidebug-redirect <url>` — redirect on detection

## Notes

HTML: only inline `<script>` blocks are obfuscated. External `src`, JSON and template scripts are left alone.

**Obfuscation isn't encryption. Don't put real secrets in client-side code.**
