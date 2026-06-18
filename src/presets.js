'use strict';

const BASE = {
  compact: true,
  simplify: true,
  target: 'browser',
  log: false,
};

const PRESETS = {
  low: {
    ...BASE,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    stringArray: true,
    stringArrayThreshold: 0.5,
    stringArrayEncoding: [],
    identifierNamesGenerator: 'mangled',
    numbersToExpressions: false,
    selfDefending: false,
    splitStrings: false,
    transformObjectKeys: false,
    unicodeEscapeSequence: false,
  },

  medium: {
    ...BASE,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.5,
    deadCodeInjection: false,
    stringArray: true,
    stringArrayThreshold: 0.75,
    stringArrayEncoding: ['base64'],
    stringArrayWrappersCount: 1,
    stringArrayWrappersType: 'variable',
    identifierNamesGenerator: 'hexadecimal',
    numbersToExpressions: true,
    selfDefending: false,
    splitStrings: true,
    splitStringsChunkLength: 10,
    transformObjectKeys: true,
    unicodeEscapeSequence: false,
  },

  high: {
    ...BASE,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.65,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.2,
    debugProtection: false,
    disableConsoleOutput: true,
    stringArray: true,
    stringArrayThreshold: 1,
    stringArrayEncoding: ['rc4'],
    stringArrayWrappersCount: 2,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersType: 'function',
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    identifierNamesGenerator: 'hexadecimal',
    numbersToExpressions: true,
    selfDefending: true,
    splitStrings: true,
    splitStringsChunkLength: 10,
    transformObjectKeys: true,
    unicodeEscapeSequence: false,
  },
};

const GUARD_OPTIONS = {
  compact: true,
  simplify: true,
  target: 'browser',
  log: false,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  stringArray: true,
  stringArrayThreshold: 0.75,
  stringArrayEncoding: ['base64'],
  identifierNamesGenerator: 'hexadecimal',
  numbersToExpressions: false,
  selfDefending: false,
  splitStrings: false,
  transformObjectKeys: false,
  unicodeEscapeSequence: false,
};

function getPreset(name) {
  const key = String(name || 'medium').toLowerCase();
  if (!PRESETS[key]) {
    throw new Error(
      `Unknown preset: "${name}". Allowed values: ${Object.keys(PRESETS).join(', ')}`
    );
  }
  return { name: key, options: { ...PRESETS[key] } };
}

module.exports = { PRESETS, getPreset, GUARD_OPTIONS };
