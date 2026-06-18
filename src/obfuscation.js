'use strict';

const JavaScriptObfuscator = require('javascript-obfuscator');

const NOISE = /javascript-obfuscator|obfuscator\.io|Virtual Machine|API key/i;

function withSilencedConsole(fn) {
  const original = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
  };
  const filter = (orig) => (...args) => {
    const text = args.map((a) => (typeof a === 'string' ? a : String(a))).join(' ');
    if (NOISE.test(text)) return;
    orig.apply(console, args);
  };
  console.log = filter(original.log);
  console.info = filter(original.info);
  console.warn = filter(original.warn);
  console.error = filter(original.error);
  try {
    return fn();
  } finally {
    console.log = original.log;
    console.info = original.info;
    console.warn = original.warn;
    console.error = original.error;
  }
}

function stripNoiseComments(code) {
  return code
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('//') && NOISE.test(trimmed)) return false;
      return true;
    })
    .join('\n');
}

function obfuscateJs(code, options) {
  if (typeof code !== 'string' || code.trim() === '') {
    return code;
  }
  const obfuscated = withSilencedConsole(() => {
    const result = JavaScriptObfuscator.obfuscate(code, options);
    return result.getObfuscatedCode();
  });
  return stripNoiseComments(obfuscated);
}

module.exports = { obfuscateJs };
