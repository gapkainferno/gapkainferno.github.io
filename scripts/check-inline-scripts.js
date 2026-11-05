#!/usr/bin/env node
// Syntax-check inline classic scripts embedded in selected HTML pages.
const fs = require('fs');
const vm = require('vm');

const pages = ['growing-guide.html'];
for (const page of pages) {
  const html = fs.readFileSync(page, 'utf8');
  const scripts = [...html.matchAll(/<script\\b([^>]*)>([\\s\\S]*?)<\\/script>/gi)];
  let checked = 0;
  for (const match of scripts) {
    const attributes = match[1] || '';
    const source = match[2] || '';
    if (/\\bsrc\\s*=/.test(attributes) || !source.trim()) continue;
    new vm.Script(source, {filename: page + '#inline-' + (++checked)});
  }
  if (!checked) throw new Error('No inline classic scripts found in ' + page);
  console.log('Inline scripts syntax OK:', page, '(' + checked + ')');
}
