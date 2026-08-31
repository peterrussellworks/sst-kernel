#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Peter Russell
//
// check-repo.mjs — README.md's "What is in here" table IS the repo's
// membership list. This checks the table and the tree agree, both
// directions: a file with no row is undocumented, a row with no file is a
// broken promise. Stdlib only; run cold from a fresh clone: node check-repo.mjs
//
// Root furniture the table doesn't itemize (dotfiles, plus EXEMPT below) is
// exempt by convention — a manifest of CONTENT, not of tooling.

import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const at = (p) => new URL(p, `file://${ROOT}`).pathname;
const EXEMPT = new Set(['README.md', 'LICENSE', 'LICENSE-DOCS', 'CONTRIBUTING.md']);

// The table: "## What is in here" to the next "## " (or EOF). A row is any
// line whose first cell is backtick-quoted — excludes the header and
// separator rows without special-casing either.
const readme = readFileSync(at('README.md'), 'utf8').split('\n');
const start = readme.findIndex((l) => l.trim() === '## What is in here');
if (start === -1) { console.log('REFUSED — README.md has no "## What is in here" heading.'); process.exit(1); }
const end = readme.findIndex((l, i) => i > start && /^## /.test(l));
const rows = readme.slice(start, end === -1 ? readme.length : end)
  .map((l) => /^\|\s*`([^`]+)`\s*\|/.exec(l)?.[1]).filter(Boolean);
if (rows.length === 0) { console.log('REFUSED — no rows shaped `| `path`| … |` under that heading.'); process.exit(1); }

// Direction 1: every row names something that exists.
const missingOnDisk = rows.filter((p) => !existsSync(at(p)));

// Direction 2: every top-level tree entry (minus dotfiles + EXEMPT) has a row.
const named = new Set(rows.flatMap((p) => [p, p.replace(/\/$/, '')]));
const missingFromTable = readdirSync(ROOT)
  .filter((n) => !n.startsWith('.') && !EXEMPT.has(n))
  .filter((n) => !named.has(n) && !named.has(statSync(at(n)).isDirectory() ? `${n}/` : n));

if (!missingOnDisk.length && !missingFromTable.length) {
  console.log(`✓ check-repo: ${rows.length} table rows, all present; every top-level tree entry has a row.`);
  process.exit(0);
}
if (missingOnDisk.length) {
  console.log('REFUSED — README.md names paths that do not exist on disk:');
  for (const p of missingOnDisk) console.log(`  · \`${p}\` — in the table, missing from the tree`);
}
if (missingFromTable.length) {
  console.log('REFUSED — the tree has entries README.md never mentions:');
  for (const n of missingFromTable) console.log(`  · ${n} — on disk, missing from the table`);
}
process.exit(1);
