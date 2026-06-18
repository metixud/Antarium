'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_EXTENSIONS = ['.js', '.html', '.htm'];
const DEFAULT_IGNORE = new Set(['node_modules', '.git', '.svn', 'dist', 'output']);

function collectFiles(inputPath, opts = {}) {
  const extensions = (opts.extensions || DEFAULT_EXTENSIONS).map((e) =>
    e.startsWith('.') ? e.toLowerCase() : '.' + e.toLowerCase()
  );
  const ignore = opts.ignore || DEFAULT_IGNORE;

  const absInput = path.resolve(inputPath);
  if (!fs.existsSync(absInput)) {
    throw new Error(`Path not found: ${absInput}`);
  }

  const stat = fs.statSync(absInput);
  const results = [];

  if (stat.isFile()) {
    const root = path.dirname(absInput);
    if (hasExtension(absInput, extensions)) {
      results.push({ abs: absInput, rel: path.relative(root, absInput) });
    }
    return { root, files: results };
  }

  const root = absInput;
  walk(absInput, root, extensions, ignore, results);
  return { root, files: results };
}

function walk(dir, root, extensions, ignore, results) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (ignore.has(entry.name)) continue;
      walk(full, root, extensions, ignore, results);
    } else if (entry.isFile() && hasExtension(full, extensions)) {
      results.push({ abs: full, rel: path.relative(root, full) });
    }
  }
}

function hasExtension(file, extensions) {
  return extensions.includes(path.extname(file).toLowerCase());
}

module.exports = { collectFiles, DEFAULT_EXTENSIONS };
