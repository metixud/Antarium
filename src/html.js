'use strict';

const { obfuscateJs } = require('./obfuscation');

const JS_TYPES = new Set([
  '',
  'text/javascript',
  'application/javascript',
  'application/ecmascript',
  'text/ecmascript',
  'module',
]);

const SCRIPT_RE = /(<script\b([^>]*)>)([\s\S]*?)(<\/script\s*>)/gi;

function escapeForHtmlScript(code) {
  return code.replace(/<\/(script)/gi, '<\\/$1');
}

function injectGuard(html, guardScript) {
  if (/<head\b[^>]*>/i.test(html)) {
    return html.replace(/(<head\b[^>]*>)/i, (m) => m + guardScript);
  }
  if (/<body\b[^>]*>/i.test(html)) {
    return html.replace(/(<body\b[^>]*>)/i, (m) => m + guardScript);
  }
  return guardScript + html;
}

function obfuscateHtml(html, jsOptions, guardCode) {
  let scripts = 0;
  let obfuscated = 0;

  let working = html;
  if (guardCode) {
    const guard = `<script>${escapeForHtmlScript(guardCode)}</script>`;
    working = injectGuard(working, guard);
  }

  const out = working.replace(SCRIPT_RE, (match, openTag, attrs, body, closeTag) => {
    scripts += 1;

    if (/\bsrc\s*=/i.test(attrs)) {
      return match;
    }

    const typeMatch = attrs.match(/\btype\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const type = typeMatch
      ? (typeMatch[2] ?? typeMatch[3] ?? typeMatch[4] ?? '').trim().toLowerCase()
      : '';
    if (!JS_TYPES.has(type)) {
      return match;
    }

    if (body.trim() === '') {
      return match;
    }

    try {
      const obf = escapeForHtmlScript(obfuscateJs(body, jsOptions));
      obfuscated += 1;
      return `${openTag}${obf}${closeTag}`;
    } catch (err) {
      process.stderr.write(`  [warn] inline <script> left as-is (${err.message})\n`);
      return match;
    }
  });

  return { html: out, scripts, obfuscated };
}

module.exports = { obfuscateHtml };
