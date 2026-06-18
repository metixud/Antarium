#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const { collectFiles, DEFAULT_EXTENSIONS } = require('./src/file');
const { getPreset, GUARD_OPTIONS } = require('./src/presets');
const { obfuscateJs } = require('./src/obfuscation');
const { obfuscateHtml } = require('./src/html');
const { buildAntiDebugSnippet, ACTIONS } = require('./src/antidebug');

const BANNER = `                       
 _____     _           _           
|  _  |___| |_ ___ ___|_|_ _ _____ 
|     |   |  _| .'|  _| | | |     |
|__|__|_|_|_| |__,|_| |_|___|_|_|_|
                                   
`;

function printHelp() {
  process.stdout.write(`${BANNER}
Usage:
  antarium <input> <output> [options]
  antarium <input> --output <dir> [options]

Arguments:
  input                 File or folder to obfuscate (.js / .html)

Options:
  -o, --output <dir>          Output folder (default: ./antarium-output)
  -p, --preset <level>        Obfuscation level: low | medium | high (default: medium)
  -e, --ext <list>            Extensions to process, e.g. .js,.html (default: ${DEFAULT_EXTENSIONS.join(',')})
      --seed <n>              Numeric seed for reproducible output
  -a, --antidebug             Enable anti-debug protection (devtools detection, shortcuts)
      --antidebug-action <a>  Reaction on detection: ${Object.keys(ACTIONS).join(' | ')} (default: redirect)
      --antidebug-redirect <url>  Redirect to <url> on detection (forces redirect action)
  -h, --help                  Show this help
`);
}

function parseArgs(argv) {
  const opts = {
    input: null,
    output: null,
    preset: 'medium',
    extensions: null,
    seed: 0,
    antidebug: false,
    antidebugAction: 'redirect',
    antidebugRedirect: 'https://metixud.xyz',
    help: false,
  };
  const positionals = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '-h':
      case '--help':
        opts.help = true;
        break;
      case '-o':
      case '--output':
        opts.output = argv[++i];
        break;
      case '-p':
      case '--preset':
        opts.preset = argv[++i];
        break;
      case '-e':
      case '--ext':
        opts.extensions = argv[++i]
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        break;
      case '--seed':
        opts.seed = parseInt(argv[++i], 10) || 0;
        break;
      case '-a':
      case '--antidebug':
        opts.antidebug = true;
        break;
      case '--antidebug-action':
        opts.antidebugAction = argv[++i];
        break;
      case '--antidebug-redirect':
        opts.antidebugRedirect = argv[++i];
        opts.antidebugAction = 'redirect';
        break;
      default:
        if (arg.startsWith('-')) {
          throw new Error(`Unknown option: ${arg}`);
        }
        positionals.push(arg);
    }
  }

  if (positionals[0]) opts.input = positionals[0];
  if (!opts.output && positionals[1]) opts.output = positionals[1];
  if (!opts.output) opts.output = path.resolve('antarium-output');

  return opts;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function buildGuard(opts) {
  const snippet = buildAntiDebugSnippet(opts.antidebugAction, {
    redirectUrl: opts.antidebugRedirect,
  });
  return obfuscateJs(snippet, GUARD_OPTIONS);
}

function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.help || !opts.input) {
    printHelp();
    process.exit(opts.input ? 0 : 1);
  }

  const { name: presetName, options: presetOptions } = getPreset(opts.preset);
  if (opts.seed) presetOptions.seed = opts.seed;

  let guardCode = null;
  if (opts.antidebug) {
    presetOptions.selfDefending = true;
    presetOptions.disableConsoleOutput = true;
    guardCode = buildGuard(opts);
  }

  const { files } = collectFiles(opts.input, {
    extensions: opts.extensions || undefined,
  });

  if (files.length === 0) {
    process.stdout.write('No .js / .html files found.\n');
    process.exit(0);
  }

  const outRoot = path.resolve(opts.output);
  ensureDir(outRoot);

  process.stdout.write(BANNER);
  process.stdout.write(`Input    : ${path.resolve(opts.input)}\n`);
  process.stdout.write(`Output   : ${outRoot}\n`);
  process.stdout.write(`Preset   : ${presetName}\n`);
  process.stdout.write(
    `Antidebug: ${opts.antidebug ? `on (${opts.antidebugAction})` : 'off'}\n`
  );
  process.stdout.write(`Files    : ${files.length}\n\n`);

  let okCount = 0;
  let failCount = 0;
  let totalIn = 0;
  let totalOut = 0;

  for (const file of files) {
    const ext = path.extname(file.abs).toLowerCase();
    const destPath = path.join(outRoot, file.rel);
    ensureDir(path.dirname(destPath));

    try {
      const source = fs.readFileSync(file.abs, 'utf8');
      totalIn += Buffer.byteLength(source, 'utf8');
      let output;

      if (ext === '.js') {
        output = obfuscateJs(source, presetOptions);
        if (guardCode) output = guardCode + '\n' + output;
        process.stdout.write(`  [js]   ${file.rel}\n`);
      } else if (ext === '.html' || ext === '.htm') {
        const res = obfuscateHtml(source, presetOptions, guardCode);
        output = res.html;
        process.stdout.write(
          `  [html] ${file.rel} (${res.obfuscated}/${res.scripts} scripts)\n`
        );
      } else {
        output = source;
        process.stdout.write(`  [copy] ${file.rel}\n`);
      }

      fs.writeFileSync(destPath, output, 'utf8');
      totalOut += Buffer.byteLength(output, 'utf8');
      okCount += 1;
    } catch (err) {
      failCount += 1;
      process.stderr.write(`  [fail] ${file.rel} -> ${err.message}\n`);
    }
  }

  process.stdout.write('\n');
  process.stdout.write(`Done: ${okCount} ok, ${failCount} failed.\n`);
  process.stdout.write(`Size: ${formatBytes(totalIn)} -> ${formatBytes(totalOut)}\n`);

  process.exit(failCount > 0 ? 2 : 0);
}

try {
  main();
} catch (err) {
  process.stderr.write(`Error: ${err.message}\n`);
  process.exit(1);
}
