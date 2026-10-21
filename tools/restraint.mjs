#!/usr/bin/env node
/**
 * Find the default ornament in what this repo ships as built output.
 *
 *   node tools/restraint.mjs            demos, eval runs and pack assets
 *   node tools/restraint.mjs <path>...  any files or directories
 *
 * WHY THIS EXISTS
 *
 * core/11-restraint.md asks an assistant to run a deletion test on every
 * element that is not content. Most of that test needs a reader. Three parts
 * of it do not, and they are exactly the marks that make a screen read as
 * generated, so they are checked here rather than trusted to a review:
 *
 *   - an emoji in markup, strings or styles
 *   - gradient text (`background-clip: text`)
 *   - an icon inside a heading, which the heading already names
 *
 * The demos are the repo's evidence that the packs work. A demo carrying the
 * ornament the rules forbid is evidence against them, so this fails rather
 * than prints.
 *
 * WHAT IT DOES NOT CATCH
 *
 * An icon on every card, a badge nobody will maintain, a section nobody asked
 * for. Those are judgements about a specific screen, and stay in the
 * checklist in core/99-review.md.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, dirname, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EXTS = new Set(['.html', '.js', '.mjs', '.jsx', '.tsx', '.vue', '.svelte', '.css']);
const SKIP = new Set(['vendor', 'node_modules', '.git']);

const args = process.argv.slice(2);
const roots = args.length
  ? args.map((a) => resolve(a))
  : ['demos', 'evals/runs', 'packs'].map((d) => join(ROOT, d));

// Emoji by default presentation, or any pictograph forced to emoji by VS16.
// Not Extended_Pictographic alone: that includes the copyright and trademark
// signs, which belong in a footer.
const EMOJI = /\p{Emoji_Presentation}|\p{Extended_Pictographic}️/gu;
const GRADIENT_TEXT = /(?:-webkit-)?background-clip\s*:\s*text/g;
const HEADING = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/g;
// A logo image in a heading is a wordmark, not an icon, so <img> is allowed.
const ICON = /<svg\b|<i\b|class\s*=\s*["'][^"']*\bicon\b/;

function walk(path, out = []) {
  if (!existsSync(path)) return out;
  if (statSync(path).isFile()) {
    if (EXTS.has(extname(path))) out.push(path);
    return out;
  }
  for (const name of readdirSync(path)) {
    if (SKIP.has(name) || name.startsWith('.')) continue;
    walk(join(path, name), out);
  }
  return out;
}

const lineAt = (text, index) => text.slice(0, index).split('\n').length;

const findings = [];
const report = (file, text, index, what) =>
  findings.push(`${relative(ROOT, file).replace(/\\/g, '/')}:${lineAt(text, index)}  ${what}`);

const files = roots.flatMap((r) => walk(r));

for (const file of files) {
  const text = readFileSync(file, 'utf8');

  for (const m of text.matchAll(EMOJI)) {
    report(file, text, m.index, `emoji ${m[0]} - interface text carries words, not pictographs`);
  }
  for (const m of text.matchAll(GRADIENT_TEXT)) {
    report(file, text, m.index, 'gradient text - its contrast cannot be checked as one ratio');
  }
  if (extname(file) !== '.css') {
    // A comment that mentions <h1> would otherwise open a match that runs to
    // the next real </h1>. Blank it, keeping newlines so line numbers hold.
    const markup = text.replace(/<!--[\s\S]*?-->/g, (c) => c.replace(/[^\n]/g, ' '));
    for (const m of markup.matchAll(HEADING)) {
      if (ICON.test(m[2])) report(file, text, m.index, `icon inside <h${m[1]}> - the heading already names the section`);
    }
  }
}

if (findings.length) {
  console.log(findings.join('\n'));
  console.log(`\n${findings.length} finding(s) across ${files.length} file(s). The rules are in core/11-restraint.md.`);
  process.exit(1);
}
console.log(`No default ornament in ${files.length} file(s).`);
