#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Peter Russell
//
// sst-kernel.mjs — the Single Source of Truth format, whole, in one file.
//
// Not the production system, but the
// entire idea in one dependency-free file you can read top to bottom. It
// builds a Dual-Native artefact and then verifies it the way a stranger
// would — from the published HTML alone.
//
//   node sst-kernel.mjs build            substrate → dist/index.html
//   node sst-kernel.mjs verify [file]    run the gates on the HTML alone
//   node sst-kernel.mjs tamper           flip one character, watch a gate fail
//   node sst-kernel.mjs seal             seal a vacancy, watch the roots stay orthogonal
//   node sst-kernel.mjs vectors          reproduce the frozen conformance vectors
//   node sst-kernel.mjs root <file>      Merkle root over a published list
//
// NOT sst.dev. This "SST" is Single Source of Truth, a content-provenance
// format; sst.dev is an unrelated serverless-infrastructure framework that
// shares the acronym. See AI-REVIEWER.md.
//
// THE IDEA IN FOUR SENTENCES
// 1. Content is atomized: each sentence is an atom whose identity is the
//    SHA-256 of its normalized text — identity from content, not position.
// 2. Atoms compose into blocks and pages whose identities are Merkle
//    roots over their children, so one changed character changes every
//    fingerprint above it.
// 3. The artefact is Dual-Native: the rendered HTML (human face) carries
//    each atom's hash in the DOM; a JSON-LD manifest (machine face) is
//    DERIVED from that rendered output — computed, never maintained — so
//    the two faces cannot drift.
// 4. Verification needs no trust and no access to the source: re-hash
//    the visible text, recompute the roots, compare with the manifest.
//    The artefact carries its own proof.
//
// Everything else in the full framework — stencils, validators, drift
// guards, the topology graph — is this same move applied repeatedly:
// replace a hand-maintained claim with a derivation, then verify the
// derivation in both directions.

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

// ───────────────────────── 1. IDENTITY PRIMITIVES ─────────────────────────
// These three functions ARE the format (SST Dual-Native v1.3). They must
// reproduce the production implementation byte-for-byte — the conformance
// vectors (`node sst-kernel.mjs vectors`) prove it. Change any of them and every
// identity in every SST artefact re-baselines; that is a format-version bump,
// never a casual edit. v1.1 → v1.2 moved the MANIFEST SHAPE and the GATE SET,
// and deliberately left this section untouched: every v1.1 identity survives.
// v1.2 → v1.3 does exactly the same again — three declarations added to the
// manifest, three gates added to the set, not one primitive touched.
//
// v1.3 proceeds on the reading that a format version names the manifest schema
// and the gate set together while identities stay stable across versions; that
// reading is proposed, not yet ruled, and `verify` dispatches on it (below).

/** Normalize text before hashing — hash the MEANING, not the formatting.
 *  The rule is fixed and load-bearing (SPEC §2.1): trim, collapse internal
 *  whitespace runs to one ASCII space, fold smart quotes to ASCII, then
 *  NFC-normalize (so "café" as U+00E9 and as e+U+0301 are ONE atom). */
const normalize = (text) =>
  text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .normalize('NFC');

/** An atom's identity IS its normalized content, hashed. */
const atomId = (content) =>
  createHash('sha256').update(normalize(content), 'utf8').digest('hex');

// Domain-separation tags (RFC 6962-style; SPEC §2.4, format v1.1). Leaves and
// interior nodes hash under distinct one-byte prefixes so no crafted input can
// make an interior node impersonate a leaf, AND a single-leaf root is DISTINCT
// from the leaf itself — a single-atom block's id no longer equals its atom's id.
const LEAF_TAG = Buffer.from([0x00]);
const NODE_TAG = Buffer.from([0x01]);

/** Leaf hash: SHA-256(0x00 ‖ leaf), leaf being the UTF-8 hex string. */
const merkleLeaf = (leaf) =>
  createHash('sha256').update(LEAF_TAG).update(leaf).digest('hex');

/** Interior-node hash: SHA-256(0x01 ‖ left ‖ right), UTF-8 hex strings. */
const merkleNode = (left, right) =>
  createHash('sha256').update(NODE_TAG).update(left).update(right).digest('hex');

/** Merkle root over an ordered list of child hashes (SPEC §2.4). Every input is
 *  first tagged as a leaf; pairs combine as interior nodes; a lone odd node
 *  carries up unchanged; empty → SHA-256("") (a real, distinguishable hash).
 *  A block's identity is the root over its atoms' ids, in order; a page's
 *  identity is the root over its blocks' ids, in order. Invariant:
 *  merkleRoot([x]) === merkleLeaf(x). */
function merkleRoot(hashes) {
  if (hashes.length === 0) return createHash('sha256').update('').digest('hex');
  let level = hashes.map(merkleLeaf);
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      next.push(i + 1 < level.length ? merkleNode(level[i], level[i + 1]) : level[i]);
    }
    level = next;
  }
  return level[0];
}

/** The unit separator for the two NON-CONTENT leaf constructions — the geometry
 *  spine's shape-coordinate (§4.7.2) and v1.3's placement leaf (§2.5). A glyph
 *  that cannot collide with the kebab/ascii vocabulary of a coordinate, so the
 *  joined fields are unambiguous without a length prefix or an escape rule. */
const US = '␟';

// ───────────────────────── 2. THE SUBSTRATE ─────────────────────────
// Two tiny CSVs, deliberately split:
//   atoms.csv   — WHAT exists (name → content). Content lives here once.
//   lattice.csv — WHERE it appears (page/section/block/role → atom name).
// The same atom may appear at many lattice coordinates (Data
// Superposition): one sentence, many surfaces, one identity.

/** The page this artefact PUBLISHES, and the set of pages a manifest may name.
 *  The fixture's second page (`notes`) is declared in the lattice and never
 *  published — a draft. §2.5 forbids naming an undisclosable coordinate, and
 *  the substrate README says what that page is there to catch. */
const PAGE = 'paper';
const PUBLISHED_PAGES = new Set([PAGE]);

/** The §2.5 head-rendered exceptions: blocks whose atoms become elements that
 *  cannot carry a data attribute (`<title>`, `<meta>`, the charter `<script>`).
 *  ONE table, read twice — by the emitter, to decide what renders into `<head>`,
 *  and by gate 3, to exempt those blocks from the reverse-parity check. Keyed on
 *  `section`/`name` ALONE, never `page`: under §2.5's optional provenance labels
 *  a superposed head block has no `page` to match, and keying on one would
 *  silently drop its exemption (P5.3, ruled 2026-08-24). */
/** The charter attestation site. §2.5's sole structural departure: this block is
 *  SYNTHESIZED from the charter, not compiled from a lattice row, so it has no
 *  lattice position (it is appended after every substrate block) and no geometry
 *  site — it is placed nowhere, so gate 8 never reaches it; gate 9 binds it. */
const CHARTER_ATTESTATION = { section: 'charter', name: 'attestation' };
const HEAD_BLOCKS = [
  { section: 'meta', name: 'seo' },
  CHARTER_ATTESTATION,
];
const isHeadBlock = (b) =>
  HEAD_BLOCKS.some((h) => h.section === b.section && h.name === b.name);

// ── Reserved sentinels (SPEC §4.7.2) ──────────────────────────────────────
// A vacant lattice site is NOT a missing row — it is a row whose atom_ref is one
// of three reserved tokens. By convention name === content === token. Each maps
// to an OCCUPANCY STATE the geometry spine (§8) hashes per coordinate.
const SENTINEL_STATE = { _PENDING_: 'pending', _NA_OMITTED_: 'na-omitted', _NA_IMPOSSIBLE_: 'na-impossible' };
const isSentinel = (ref) => Object.prototype.hasOwnProperty.call(SENTINEL_STATE, (ref ?? '').trim());
/** A ref's occupancy: a sentinel → its vacancy state; anything real → present. */
const occupancyOf = (ref) => SENTINEL_STATE[(ref ?? '').trim()] ?? 'present';

/** Split one CSV line into fields — quoted (commas survive) or bare. Used for the
 *  header too, so a quote-all dialect (the conformance fixture) parses the same
 *  as this kernel's own bare-header files. (Minimal: no escaped-quote / embedded-
 *  newline handling — neither substrate needs it.) */
const parseFields = (line) => [...line.matchAll(/"([^"]*)"|([^,]+)/g)].map((m) => m[1] ?? m[2]);

function parseCsv(path) {
  const [header, ...lines] = readFileSync(path, 'utf8').trim().split('\n');
  const cols = parseFields(header);
  return lines.map((line) => {
    const fields = parseFields(line);
    return Object.fromEntries(cols.map((c, i) => [c, fields[i] ?? '']));
  });
}

/** The substrate resolves relative to THIS FILE, not the shell's cwd, so `build`
 *  and `vectors` read the same bytes from any directory. Outputs still land in
 *  the cwd (dist/), which is where `verify` looks for them by default. */
const SUBSTRATE = new URL('substrate/', import.meta.url);

/** Read the substrate: atoms (name → content) + raw lattice rows (sentinels
 *  INCLUDED — the geometry spine needs them; the content compiler filters them). */
function readSubstrate(dir = SUBSTRATE) {
  const atoms = new Map(parseCsv(new URL('atoms.csv', dir)).map((r) => [r.name, r.content]));
  const rows = parseCsv(new URL('lattice.csv', dir));
  return { atoms, rows };
}

/** Compile the CONTENT spine from atoms + lattice rows. THE LOAD-BEARING RULE
 *  (SPEC §4.7.2): sentinel rows are FILTERED here — a vacant site is geometry
 *  only; it never enters a block id, the manifest, or the DOM. A block that is
 *  wholly vacant therefore never materializes. Blocks preserve row order — order
 *  is part of identity (the Merkle root is over an ORDERED list).
 *
 *  Each block also carries its COORDINATE — page / section / name / order, where
 *  order is its position among the blocks of its own page. The coordinate is not
 *  identity (identity is the Merkle root over the atoms, and nothing else); it is
 *  what §2.5's provenance label claims, and what P2 makes optional when several
 *  coordinates share one identity. */
function compileBlocks(atoms, rows) {
  const blocks = [];
  for (const row of rows) {
    if (isSentinel(row.atom_ref)) continue; // content-spine filter
    const content = atoms.get(row.atom_ref);
    if (content === undefined) throw new Error(`dangling atom_ref: ${row.atom_ref}`);
    const key = `${row.page}/${row.section}/${row.block}`;
    let block = blocks.find((b) => b.key === key);
    if (!block) {
      block = {
        key,
        page: row.page,
        section: row.section,
        name: row.block,
        order: blocks.filter((b) => b.page === row.page).length,
        atoms: [],
      };
      blocks.push(block);
    }
    block.atoms.push({ role: row.role, content, hash: atomId(content) });
  }
  for (const b of blocks) b.hash = merkleRoot(b.atoms.map((a) => a.hash));
  return blocks;
}

// ─────────── THE GEOMETRY SPINE — the shape, incl. the negative space ───────────
// A SECOND Merkle root, peer to the content root (SPEC §4.7.2). Where content
// attests WHAT IS PRESENT, geometry attests the full bill of materials — every
// declared site, occupied or vacant — so the Swiss-cheese is provable, not merely
// asserted. Its leaf is a SHAPE-COORDINATE valued by OCCUPANCY-STATE:
//   coordinate = (page, section, block, block_type, role)   ← stable address
//   value      = present | pending | na-omitted | na-impossible
// so the root is MATTER-INVARIANT: it moves only when the SHAPE changes (a site
// added/removed) or an OCCUPANCY-STATE changes (a hole filled or sealed) — NEVER
// on a content edit. Same merkleRoot primitive and the same row-order discipline
// as the content spine (page → section → block → role, first appearance).

const geomLeaf = (page, section, block, blockType, role, state) =>
  createHash('sha256').update([page, section, block, blockType, role, state].join(US)).digest('hex');

/** A role's aggregate state (a list-valued role is still ONE coordinate):
 *  present if any real atom is placed; else its (single) sentinel's state. */
const roleState = (refs) =>
  refs.some((r) => occupancyOf(r) === 'present') ? 'present' : refs.length ? occupancyOf(refs[0]) : 'pending';

/** ONE LATTICE PAGE's SITES, in canonical (first-appearance) order — section →
 *  block → role, each role one coordinate valued by its aggregate occupancy state.
 *  This is the ordered list the whole-artefact spine hashes. It is NOT the list a
 *  page publishes: a lattice page and a rendered page are different objects (a
 *  page draws blocks from many lattice pages, and a lattice page declares sites
 *  the page never renders), so the published slice is built from the placements. */
function pageSites(rows, page) {
  const sections = []; const sIdx = new Map();
  for (const r of rows) {
    if (r.page !== page) continue;
    const blockType = r.block_type ?? 'paragraph'; // this kernel's own lattice has no block_type column
    let s = sIdx.get(r.section); if (!s) { s = { section: r.section, blocks: [], idx: new Map() }; sections.push(s); sIdx.set(r.section, s); }
    let b = s.idx.get(r.block); if (!b) { b = { block: r.block, blockType, roles: [], idx: new Map() }; s.blocks.push(b); s.idx.set(r.block, b); }
    let ro = b.idx.get(r.role); if (!ro) { ro = { role: r.role, refs: [] }; b.roles.push(ro); b.idx.set(r.role, ro); }
    ro.refs.push(r.atom_ref);
  }
  const sites = [];
  for (const s of sections)
    for (const b of s.blocks)
      for (const ro of b.roles)
        sites.push({ section: s.section, block: b.block, block_type: b.blockType, role: ro.role, state: roleState(ro.refs) });
  return sites;
}

/** ONE page's geometry root from its ordered sites: leaves per block, a root per
 *  block, a root per section, a root for the page — the same hierarchy and the
 *  same row-order discipline as the content spine. Pure over `sites`, which is
 *  what lets gate 8 recompute it from the manifest alone. */
function pageGeometryRoot(page, sites) {
  const sections = []; const sIdx = new Map();
  for (const st of sites) {
    let s = sIdx.get(st.section); if (!s) { s = { blocks: [], idx: new Map() }; sections.push(s); sIdx.set(st.section, s); }
    let b = s.idx.get(st.block); if (!b) { b = { leaves: [] }; s.blocks.push(b); s.idx.set(st.block, b); }
    b.leaves.push(geomLeaf(page, st.section, st.block, st.block_type, st.role, st.state));
  }
  return merkleRoot(sections.map((s) => merkleRoot(s.blocks.map((b) => merkleRoot(b.leaves)))));
}

/** Build the geometry tree + census from the RAW lattice rows (sentinels
 *  INCLUDED). Returns { root, siteCount, blockCount, states }. */
function buildGeometry(rows) {
  const pages = [];
  for (const r of rows) if (!pages.includes(r.page)) pages.push(r.page);
  const states = { present: 0, pending: 0, 'na-omitted': 0, 'na-impossible': 0 };
  let siteCount = 0; const blockKeys = new Set();
  const pageRoots = pages.map((page) => {
    const sites = pageSites(rows, page);
    for (const st of sites) { states[st.state]++; siteCount++; blockKeys.add(`${page}/${st.section}/${st.block}`); }
    return pageGeometryRoot(page, sites);
  });
  return { root: merkleRoot(pageRoots), siteCount, blockCount: blockKeys.size, states };
}

/** ONE COORDINATE's sites: one entry per role declared at (page, section, block),
 *  in first-appearance order, valued by that role's aggregate occupancy state —
 *  vacancies included, which is the whole point of a geometry spine. */
function coordinateSites(rows, page, section, block) {
  const roles = []; const idx = new Map();
  let blockType = 'paragraph'; // this kernel's own lattice has no block_type column
  for (const r of rows) {
    if (r.page !== page || r.section !== section || r.block !== block) continue;
    if (r.block_type) blockType = r.block_type;
    let ro = idx.get(r.role); if (!ro) { ro = { role: r.role, refs: [] }; roles.push(ro); idx.set(r.role, ro); }
    ro.refs.push(r.atom_ref);
  }
  return roles.map((ro) => ({ section, block, block_type: blockType, role: ro.role, state: roleState(ro.refs) }));
}

/** The GEOMETRY SLICE a page publishes in its v1.3 manifest, DEFINED BY ITS
 *  PLACEMENTS: for every coordinate the page places, that coordinate's sites — the
 *  roles it renders AND the vacancies it declares — in placement order, with the
 *  root over exactly that list.
 *
 *  Not the lattice page's slice, and the difference is measured rather than
 *  aesthetic: on a real artefact one rendered page draws its blocks from many
 *  lattice pages, and a lattice page declares sites (a section still in draft)
 *  that no page renders. A slice keyed on the lattice page would publish sites
 *  this page cannot show and omit sites it does show, so gate 8 would refuse an
 *  ordinary composed page. Keyed on the placements, the slice is a statement about
 *  THIS page, and the page is the only thing the verifier has.
 *
 *  The whole-artefact sidecar stays where it is — it carries the cross-page root,
 *  which no single page can. */
const geometrySlice = (rows, page, placements) => {
  const sites = []; const seen = new Set();
  for (const p of placements) {
    const key = `${p.section}${US}${p.name}`;
    if (seen.has(key)) continue; // a coordinate placed twice declares its sites once
    seen.add(key);
    sites.push(...coordinateSites(rows, page, p.section, p.name));
  }
  return { root: pageGeometryRoot(page, sites), sites };
};

const geometryManifest = (g) => ({
  '@type': 'SstGeometrySpine',
  version: '1.0',
  geometry_root: g.root,
  site_count: g.siteCount,
  block_count: g.blockCount,
  states: g.states,
});

// ───────────────────────── 3. THE HUMAN FACE ─────────────────────────
// Plain semantic HTML. The one non-negotiable: every atom is its own
// element carrying data-atom-hash, wrapped in an element carrying its
// block's data-block-hash. The DOM itself is the evidence trail.

const TAG = { heading: 'h1', subtitle: 'p', body: 'p' };

/** Entity-encode at render; the DOM-text rule decodes at verify (§6.2). The
 *  round-trip is what lets an atom containing `&` or `<` still re-hash. */
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s) => esc(s).replace(/"/g, '&quot;');

function renderBody(blocks) {
  return blocks
    .map(
      (b) =>
        `  <section data-block-hash="${b.hash}">\n` +
        b.atoms
          .map(
            (a) =>
              `    <${TAG[a.role] ?? 'p'} data-atom-hash="${a.hash}">${esc(a.content)}</${TAG[a.role] ?? 'p'}>`
          )
          .join('\n') +
        `\n  </section>`
    )
    .join('\n');
}

/** Head-rendered blocks (§2.5's declared exception). These atoms become `<title>`
 *  and `<meta>` — elements that cannot carry `data-atom-hash` — so they are
 *  attested by the manifest alone, and gate 3 exempts them in reverse. No prose
 *  is hardcoded here: even the page title comes from the substrate. */
function renderHeadBlocks(blocks) {
  return blocks
    .flatMap((b) =>
      b.atoms.map((a) =>
        a.role === 'title'
          ? `<title>${esc(a.content)}</title>`
          : `<meta name="${a.role}" content="${escAttr(a.content)}">`
      )
    )
    .join('\n');
}

// ───────────────────────── 4. THE MACHINE FACE ─────────────────────────
// Manifest–DOM Parity: the manifest is built FROM the rendered body.
// Selection comes from rendering (which block hashes appear in the DOM);
// content comes from the substrate. Both faces trace to the same source,
// so they cannot disagree — by construction, not by discipline.

/** Read the evidence attributes at ATTRIBUTE POSITION, and record for each
 *  atom which block wrapper (if any) encloses it. Also records each block
 *  wrapper's SPAN — where its markup opens and closes — because gate 6 needs
 *  the block's own visible text, and a block's own text excludes any nested
 *  block's (that text is the nested block's evidence, not this one's).
 *
 *  Never by regex over raw source: the same 64 hex characters inside a CSS
 *  comment, a <script> body or an HTML comment would count as evidence, so a
 *  page could manufacture a block it does not render. Reproduced on the
 *  conformance fixture — delete a block element, add a <style> block whose
 *  CSS comment carries the deleted data-block-hash, and gate 3 passed again.
 *  Raw-text elements are skipped whole for the same reason: their content is
 *  character data, not markup.
 *
 *  Minimal by design (this file reads output THIS project emits, which escapes
 *  `<` in text and in attribute values and nests properly) — a verifier reading
 *  a stranger's HTML wants a real parser. */
function readEvidence(html) {
  const VOID = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
  const RAW = new Set(['script', 'style', 'textarea', 'title']);
  const attr = (attrs, name) => {
    const m = new RegExp(`\\b${name}="([0-9a-f]{64})"`).exec(attrs);
    return m ? m[1] : null;
  };
  const blocks = [];
  const atoms = [];
  const open = []; // innermost last; `block` = the block wrapper enclosing this element
  const tag = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][a-zA-Z0-9:-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g;
  let m;
  while ((m = tag.exec(html))) {
    if (m[0].startsWith('<!--')) continue;
    const name = m[2].toLowerCase();
    if (m[1]) {
      for (let d = open.length - 1; d >= 0; d--) {
        if (open[d].name !== name) continue;
        for (let k = open.length - 1; k >= d; k--) {
          const owns = open[k].owns;
          if (owns !== null) { blocks[owns].innerEnd = m.index; blocks[owns].outerEnd = tag.lastIndex; }
        }
        open.length = d;
        break;
      }
      continue;
    }
    const enclosing = open.length ? open[open.length - 1].block : null;
    const enclosingIdx = open.length ? open[open.length - 1].blockIdx : null;
    const blockHash = attr(m[3], 'data-block-hash');
    const atomHash = attr(m[3], 'data-atom-hash');
    let owns = null;
    if (blockHash) {
      owns = blocks.length;
      blocks.push({
        hash: blockHash,
        parent: enclosingIdx,
        outerStart: m.index,
        innerStart: tag.lastIndex,
        // Defaults for an element that is never closed; overwritten on the close tag.
        innerEnd: html.length,
        outerEnd: html.length,
      });
    }
    if (atomHash) atoms.push({ hash: atomHash, claimedBy: enclosing });
    if (VOID.has(name) || m[4]) {
      if (owns !== null) { blocks[owns].innerEnd = blocks[owns].innerStart; blocks[owns].outerEnd = tag.lastIndex; }
      continue;
    }
    if (RAW.has(name)) {
      const close = new RegExp(`</${name}\\s*>`, 'gi');
      close.lastIndex = tag.lastIndex;
      const end = close.exec(html);
      if (owns !== null) {
        blocks[owns].innerEnd = end ? end.index : html.length;
        blocks[owns].outerEnd = end ? end.index + end[0].length : html.length;
      }
      tag.lastIndex = end ? end.index + end[0].length : html.length;
      continue;
    }
    open.push({ name, block: blockHash ?? enclosing, blockIdx: owns ?? enclosingIdx, owns });
  }
  return { blocks, atoms };
}

/** A block wrapper's OWN markup: its inner span, minus the whole span of every
 *  block wrapper nested directly inside it. Nesting is outside §2.7's canonical
 *  shape, but a verifier reads strangers' pages, and attributing a nested
 *  block's text to its parent would make gate 6 report a residue that is in
 *  fact attested — one block away. */
function ownMarkup(html, blocks, i) {
  const b = blocks[i];
  let out = '';
  let cursor = b.innerStart;
  for (const child of blocks) {
    if (child.parent !== i) continue;
    out += html.slice(cursor, child.outerStart);
    cursor = Math.max(cursor, child.outerEnd);
  }
  return out + html.slice(cursor, b.innerEnd);
}

// ─────────── THE COMPOSITION SPINE (v1.3) ───────────
// A THIRD root, over the page's PLACEMENTS. The page root is a bill of the
// identities the page carries and says so (P1-A, below); nothing on the page
// attested WHERE those identities were printed or HOW MANY TIMES — so a page
// with two blocks swapped, a block printed twice, or one of a superposed pair
// deleted verified clean. The composition root closes that: order is meaning,
// and the same placements in another order give another root.
//
// The leaf is a PLACEMENT-COORDINATE — the identity placed, and the coordinate
// it was placed at — under the same unit separator the geometry leaf uses. The
// root is the same `merkleRoot`, so the leaves are domain-separated by the
// existing tags and a single-placement page still has a root distinct from its
// leaf.
const placementLeaf = (block, section, name) =>
  createHash('sha256').update([block, section, name].join(US)).digest('hex');

// §2.5 provenance labels (P2, ruled 2026-08-24). The four coordinate fields are
// OPTIONAL, and each is a CLAIM about where this page rendered the identity.
const COORDINATE_FIELDS = ['page', 'section', 'name', 'order'];

/** The label for one identity: only what EVERY coordinate carrying it agrees on.
 *  "A claim that cannot be verified is not made" — where two lattice rows share a
 *  block id, no DOM evidence can say which one this rendering came from, so the
 *  fields they disagree about are omitted rather than guessed. `page` carries the
 *  extra rule: omitted whenever any candidate coordinate is not disclosable at
 *  this exposure level (a draft page, a private-species coordinate).
 *
 *  Note that under evidence-based selection the disclosability clause cannot fire
 *  alone: an identity reaches the manifest because THIS page rendered it, so the
 *  published page is always among the candidates, and candidates agreeing on an
 *  unpublished page is impossible. The clause is stated because the rule is the
 *  rule; an implementation selecting from a render plan can reach it. */
function labelFor(candidates, publishedPages) {
  const label = {};
  for (const field of COORDINATE_FIELDS) {
    const value = candidates[0][field];
    if (!candidates.every((c) => c[field] === value)) continue;
    if (field === 'page' && !publishedPages.has(value)) continue;
    label[field] = value;
  }
  return label;
}

function buildManifest(renderedBody, blocks, { page, publishedPages, version, rendered = [], rows = [], attestation }) {
  const domOrder = readEvidence(renderedBody).blocks.map((b) => b.hash);
  const evidence = new Set(domOrder);
  const head = blocks.filter((b) => b.page === page && isHeadBlock(b));
  const selected = blocks.filter((b) => evidence.has(b.hash) || head.includes(b));

  // P1-A (ruled 2026-08-24): ONE ENTRY PER BLOCK IDENTITY, however many times the
  // page renders it — the manifest is a bill of the identities the page carries,
  // not a transcript of its placements. Two lattice rows with identical content
  // Merkle to the same block id; a naive filter emits both, so `block_count` and
  // `page_merkle_root` would count placements and drift from any implementation
  // that counts identities. First occurrence in canonical (lattice) order wins;
  // equal roots mean equal atom-id sequences, so the twins' atoms are the same
  // atoms and which object survives cannot change the content.
  const byHash = new Map();
  for (const b of selected) if (!byHash.has(b.hash)) byHash.set(b.hash, b);
  const included = [...byHash.values()];

  // §2.5 minimal manifest shape. Everything below the hashes is metadata — none
  // of it enters a block hash (block id = Merkle root over atom ids ONLY), so the
  // extra fields are free: they make the machine face self-describing without
  // touching identity. (This kernel's demo substrate has no block_type column, so
  // block_type is the paragraph default. The block list is in canonical lattice
  // order; a block's `order` label is its position on its own page, which is a
  // different number and a different claim.)
  const entries = included.map((b) => ({
    '@type': 'SstBlock',
    hash: b.hash,
    ...labelFor(blocks.filter((c) => c.hash === b.hash), publishedPages),
    block_type: 'paragraph',
    atoms: b.atoms.map((a, ai) => ({
      '@type': 'SstAtom',
      hash: a.hash,
      role: a.role,
      order: ai,
      content: a.content,
    })),
  }));

  if (version !== '1.3') {
    return {
      '@context': 'https://danielarussell.com/contexts/sst-manifest-v1',
      '@type': 'SstPageManifest',
      page,
      version,
      page_merkle_root: merkleRoot(entries.map((e) => e.hash)),
      block_count: entries.length,
      atom_count: entries.reduce((n, e) => n + e.atoms.length, 0),
      blocks: entries,
    };
  }

  // ── v1.3 additions ──────────────────────────────────────────────────────
  // The charter attestation block joins the bill, appended after every substrate
  // block (§2.5: it has no lattice position), so the operator's terms are inside
  // page_merkle_root instead of merely sitting beside it in the head.
  entries.push(attestation);

  // The PLACEMENT TRANSCRIPT. `blocks` answers "what identities does this page
  // carry"; `placements` answers the other question — what did it print, in what
  // order, how many times. A superposed identity is ONE entry above and as many
  // entries here as the page renders it.
  //
  // This is §2.5's P4 witness. A bill entry must omit the coordinate fields its
  // candidate lattice rows disagree about, because no DOM evidence says which row
  // a rendering came from; a placement IS that evidence, so it names its own
  // coordinate and omits nothing. The twins that reach `blocks` as one shortened
  // label reach `placements` as two full ones.
  //
  // Derived from the rendered body, like every other selection here: the order is
  // the DOM's, and the coordinates come from the blocks that produced it. The
  // guard is not decoration — if those two ever disagree the manifest would be
  // describing a page that was not rendered.
  if (domOrder.length !== rendered.length) throw new Error('placement drift: DOM wrappers ≠ rendered blocks');
  const placements = rendered.map((b, i) => {
    if (domOrder[i] !== b.hash) throw new Error(`placement drift at ${i}: DOM ${domOrder[i]} ≠ ${b.hash}`);
    return { block: b.hash, section: b.section, name: b.name };
  });

  return {
    '@context': 'https://danielarussell.com/contexts/sst-manifest-v1',
    '@type': 'SstPageManifest',
    page,
    version,
    page_merkle_root: merkleRoot(entries.map((e) => e.hash)),
    composition_root: merkleRoot(placements.map((p) => placementLeaf(p.block, p.section, p.name))),
    block_count: entries.length,
    atom_count: entries.reduce((n, e) => n + e.atoms.length, 0),
    blocks: entries,
    placements,
    geometry: geometrySlice(rows, page, placements),
  };
}

/** The charter: the operator's terms, as data in the head — sovereignty
 *  declared where every reader (human or machine) must pass. A conformant
 *  charter declares ALL SIX universal permission categories (SPEC §5.1.1) —
 *  silence is not consent, so every category takes an explicit stance.
 *
 *  This is the DEMO ARTEFACT's charter, and it is deliberately strict: it stands
 *  for an operator who has not licensed their content away. The repository that
 *  ships this file has its own, permissive charter (charter.yaml), because its
 *  own licences grant what this one withholds. Compare the two. */
const CHARTER = {
  '@type': 'SstCharter',
  operator: 'sst-kernel reference artefact',
  permissions: {
    human_reading: 'public',
    agent_ingestion: 'permitted_with_attribution',
    quoting: 'permitted_with_attribution',
    derivative_works: 'prohibited',
    training: 'prohibited',
    oracle_and_sentiment_mining: 'prohibited',
  },
};

/** THE CANONICAL FORM OF A CHARTER, and the one place it is defined.
 *
 *  Take the served JSON-LD charter document; drop the `attestation` member, and
 *  nothing else; serialize what remains with the standard JSON serializer, keys in
 *  document order, no added whitespace. That string is the attestation ATOM's
 *  content, so its id is the same content hash any atom gets, and the attestation
 *  BLOCK is the Merkle root over that one id.
 *
 *  This is not a form invented here. It is the rule the reference implementation
 *  already applies to its own charter (its charter compiler's attestation block),
 *  transcribed so that a page emitted by either implementation is checked by one
 *  rule rather than two that happen to agree today. Measured before adopting: the
 *  two produce identical bytes for the same document.
 *
 *  ONE function, read twice: the emitter hashes it into the attestation atom, and
 *  gate 9 recomputes it from the served `<script>`, so the terms a reader is shown
 *  and the terms under the page root cannot drift. (Parsing and re-serializing is
 *  a fixed point for anything this serializer emitted, so the canonical form is
 *  the served form, less the pointer.)
 *
 *  The pointer is excluded because it cannot be inside what it points at: an
 *  attestation over bytes containing its own hash has no fixed point. Everything
 *  a reader relies on — the operator, every permission category, and on the entity
 *  shape every field of the entity — is inside the hash; only the address is
 *  outside it. */
function charterAtomContent(charter) {
  const { attestation, ...terms } = charter;
  return JSON.stringify(terms);
}

/** The charter attestation block: ONE block, ONE atom whose content is the served
 *  charter. Until v1.3 the charter was declared in the head and entered no hash at
 *  all — flipping `training` moved nothing and failed nothing, on an artefact
 *  whose whole subject is sovereignty. This brings it under the page root using
 *  the head-block mechanism §2.5 already grants the SEO title: the atom renders as
 *  JSON in `<head>`, an element that cannot carry a data attribute, so gate 3
 *  exempts it in reverse — the exemption is from DOM EVIDENCE, never from
 *  manifest membership.
 *
 *  Single source: the charter object. The atom is DERIVED at build time and never
 *  copied into the substrate — a second copy of the terms would be exactly the
 *  drift this format exists to prevent. */
function charterAttestationBlock(charter) {
  const content = charterAtomContent(charter);
  const hash = atomId(content);
  return {
    '@type': 'SstBlock',
    hash: merkleRoot([hash]),
    // A fixed coordinate, not a lattice row: identical on every page the charter
    // is served on, hence `global`. P2's agreement rule governs several lattice
    // rows sharing one identity and does not reach a synthesized block.
    page: 'global',
    section: CHARTER_ATTESTATION.section,
    name: CHARTER_ATTESTATION.name,
    block_type: 'charter',
    order: 0,
    atoms: [{ '@type': 'SstAtom', hash, role: 'charter', order: 0, content }],
  };
}

/** The format version this kernel EMITS. `verify` reads whatever the artefact in
 *  front of it declares and runs that version's gate set (see the dispatch). */
const FORMAT_VERSION = '1.3';

/** Compile the artefact once: substrate → blocks → both faces → all three spines.
 *  `build` writes what this returns; `vectors` compares it to the frozen values.
 *  Parameterised by version because the frozen v1.2 set is a promise this kernel
 *  keeps: the older shape is still emitted on demand, byte-for-byte. */
function compileArtefact(version = FORMAT_VERSION) {
  const { atoms, rows } = readSubstrate();
  const blocks = compileBlocks(atoms, rows);
  const mine = blocks.filter((b) => b.page === PAGE);
  const rendered = mine.filter((b) => !isHeadBlock(b));
  const body = renderBody(rendered);
  const head = renderHeadBlocks(mine.filter((b) => isHeadBlock(b)));
  const attestation = charterAttestationBlock(CHARTER);
  const manifest = buildManifest(body, blocks, {
    page: PAGE, publishedPages: PUBLISHED_PAGES, version, rendered, rows, attestation,
  });
  const geometry = geometryManifest(buildGeometry(rows));
  // The charter carries its own address: which block, and which atom inside it,
  // attests these terms. A reader who has only the charter can find its proof.
  const charter = version === '1.3'
    ? { ...CHARTER, attestation: { block: attestation.hash, atom: attestation.atoms[0].hash } }
    : CHARTER;
  return { rows, blocks, body, head, manifest, geometry, charter };
}

/** The published page. One template, used by `build` and by the frozen page
 *  vector, so a drift between what is written and what is frozen is impossible. */
const renderPage = ({ head, charter, manifest, body }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
${head}
<script type="application/ld+json">${JSON.stringify(charter)}</script>
<script type="application/ld+json">${JSON.stringify(manifest)}</script>
<style>body{max-width:42rem;margin:3rem auto;font:1rem/1.6 Georgia,serif;padding:0 1rem}h1{font-weight:normal}</style>
</head>
<body>
${body}
</body>
</html>
`;

function build() {
  const { blocks, body, head, manifest, geometry, charter } = compileArtefact();
  const html = renderPage({ head, charter, manifest, body });
  mkdirSync('dist', { recursive: true });
  writeFileSync('dist/index.html', html);

  // The geometry spine is a COMMITTED SIDECAR, not a face in the page — unlike
  // content, it cannot be recomputed from the published HTML alone (the vacant
  // sites are, by definition, not rendered). It attests the shape against the
  // substrate; the operator commits it beside the page (production writes
  // content/geometry-manifest.json; this kernel writes dist/geometry-manifest.json).
  writeFileSync('dist/geometry-manifest.json', JSON.stringify(geometry, null, 2) + '\n');

  console.log(`built dist/index.html — format v${manifest.version}, ${manifest.block_count} block identities from ${blocks.length} lattice coordinates`);
  console.log(`      ${manifest.placements.length} rendered placements, page root ${manifest.page_merkle_root.slice(0, 16)}…`);
  console.log(`      composition root ${manifest.composition_root.slice(0, 16)}…   page geometry root ${manifest.geometry.root.slice(0, 16)}…`);
  console.log(`      dist/geometry-manifest.json — geometry root ${geometry.geometry_root.slice(0, 16)}…  ${JSON.stringify(geometry.states)}`);
}

// ─────────── THE §6.2 DOM-TEXT RULE (gate 5's DOM-side counterpart) ───────────
// Ported from the production implementation (src/lib/validators/validateHallmark)
// so this kernel and the full framework share ONE definition of the rule — the
// whole point of the conformance vectors is that there is only one.

/** The HTML entities an emitter produces in text content. `&amp;` is decoded in
 *  the same single left-to-right pass, so `&amp;lt;` yields the literal `&lt;`. */
const NAMED_ENTITIES = {
  lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', amp: '&',
  ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’',
  hellip: '…', mdash: '—', ndash: '–',
  copy: '©', reg: '®', trade: '™', deg: '°',
  middot: '·', bull: '•', times: '×',
};

const decodeEntities = (t) =>
  t
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
    .replace(/&([a-zA-Z][a-zA-Z0-9]*);/g, (m, name) =>
      Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, name) ? NAMED_ENTITIES[name] : m
    );

/** Reconstruct an atom's content from its element's innerHTML (§6.2): strip every
 *  tag EXCEPT <em>/<strong> (decorative children drop, their text stays), decode
 *  entities, re-escape literal * to \*, then map the surviving <em>/<strong> back
 *  to the *…* / **…** inline marks. */
function domTextToContent(inner) {
  let s = inner.replace(/<(?!\/?(?:em|strong)\b)[^>]+>/gi, '');
  s = decodeEntities(s);
  s = s.replace(/\*/g, '\\*');
  return s
    .replace(/<em\b[^>]*>([\s\S]*?)<\/em\s*>/gi, '*$1*')
    .replace(/<strong\b[^>]*>([\s\S]*?)<\/strong\s*>/gi, '**$1**');
}

/** Decoded plain text (strip all tags, decode entities) — the projected-atom
 *  path, which carries no inline vocabulary in v1.2. */
const domTextPlain = (inner) => decodeEntities(inner.replace(/<[^>]+>/g, ''));

/** The CLOSED projected-atom registry (SPEC §6.2). The v1.2 vocabulary is exactly
 *  `enum-label`: lowercase the whole string; each `_` → one ASCII space. */
const PROJECTIONS = {
  'enum-label': (s) => s.toLowerCase().replace(/_/g, ' '),
};

/** Which rendered atoms declare a projection, read from the DOM. Gate 6 needs
 *  this: a projected atom's VISIBLE text is the projection of its canonical
 *  content, so the expected block text must be projected the same way. */
function projectionsInDom(html) {
  const found = new Map();
  for (const m of html.matchAll(/<[a-z0-9]+\b[^>]*\bdata-atom-hash="([a-f0-9]{64})"[^>]*>/gi)) {
    const p = /\bdata-atom-projected="([^"]*)"/.exec(m[0]);
    if (p) found.set(m[1], p[1]);
  }
  return found;
}

/** Run the §6.2 DOM-text rule over a rendered page against its manifest. For each
 *  element carrying data-atom-hash: a VERBATIM atom's reconstructed visible text
 *  must re-hash to the declared id; a PROJECTED atom (valued data-atom-projected
 *  marker) recomputes the named projection from the manifest's canonical content.
 *  A bare marker, an unknown projection, or a mismatch fails. */
function domTextRule(html, manifest) {
  const errors = [];
  const canonicalByHash = new Map();
  for (const b of manifest.blocks ?? [])
    for (const a of b.atoms ?? []) canonicalByHash.set(a.hash, a.content);

  const re = /<([a-z0-9]+)\b[^>]*\bdata-atom-hash="([a-f0-9]{64})"[^>]*>([\s\S]*?)<\/\1>/gi;
  for (const m of html.matchAll(re)) {
    const openTag = m[0].slice(0, m[0].indexOf('>'));
    const hash = m[2];
    const proj = /\bdata-atom-projected(?:="([^"]*)")?/.exec(openTag);
    if (proj) {
      const projection = proj[1];
      if (!projection) { errors.push(`<${m[1]} …${hash.slice(0, 8)}> BARE data-atom-projected marker (must name a closed-registry projection)`); continue; }
      if (!Object.prototype.hasOwnProperty.call(PROJECTIONS, projection)) { errors.push(`<${m[1]} …${hash.slice(0, 8)}> UNKNOWN projection "${projection}"`); continue; }
      const canonical = canonicalByHash.get(hash);
      if (canonical === undefined) continue; // absent from manifest ⇒ already a gate-3 failure
      const projected = normalize(PROJECTIONS[projection](canonical));
      const rendered = normalize(domTextPlain(m[3]));
      if (projected !== rendered) errors.push(`<${m[1]} …${hash.slice(0, 8)}> projected("${projection}") ${JSON.stringify(rendered)} ≠ ${JSON.stringify(projected)}`);
      continue;
    }
    const content = domTextToContent(m[3]);
    if (atomId(content) !== hash) errors.push(`<${m[1]} …${hash.slice(0, 8)}> visible text reconstructs to ${atomId(content).slice(0, 8)}… (content: ${JSON.stringify(content)})`);
  }
  return { ok: errors.length === 0, errors };
}

// ─────────── GATE 6 — BLOCK COMPLETENESS (Dual-Native v1.2) ───────────
// Gates 1–5 prove every hashed element authentic; only completeness proves the
// page contains NOTHING ELSE. For every block wrapper, the block's visible text —
// §6.2-extracted, §2.2-normalized, declared projections applied — must reconstruct
// exactly from the concatenation of the block's atoms' canonical text in lattice
// order. Any residue is visible text no atom attests, and is reported verbatim.
// Structural markup carrying no visible text is permitted; visible glue characters
// either live inside atoms or are declared projections.
//
// Found by adversarial injection (2026-08-04): a paragraph inserted BETWEEN two
// attested atoms, inside their block wrapper, passes gates 1–5 and the DOM-text
// rule untouched — every hashed element is still authentic, and the injected one
// simply carries no hash to check.

/** The extra characters `actual` carries that `expected` does not — the common
 *  prefix and suffix trimmed away, so an injection is reported as itself. */
function residueOf(actual, expected) {
  let p = 0;
  while (p < actual.length && p < expected.length && actual[p] === expected[p]) p++;
  let s = 0;
  while (s < actual.length - p && s < expected.length - p && actual[actual.length - 1 - s] === expected[expected.length - 1 - s]) s++;
  let e = actual.length - s;
  if (p >= e) return '';
  // A residue quoted to a human must not fabricate a corrupted word: back the
  // prefix/suffix trim off to the nearest whitespace boundary before slicing.
  while (p > 0 && !/\s/.test(actual[p - 1])) p--;
  while (e < actual.length && !/\s/.test(actual[e])) e++;
  return actual.slice(p, e);
}

function blockCompleteness(html, manifest, evidence) {
  const errors = [];
  const entryByHash = new Map((manifest.blocks ?? []).map((b) => [b.hash, b]));
  const projected = projectionsInDom(html);

  evidence.blocks.forEach((b, i) => {
    const entry = entryByHash.get(b.hash);
    if (!entry) return; // not in the manifest ⇒ already a gate-3 forward failure
    const expected = normalize(
      (entry.atoms ?? [])
        .map((a) => {
          const p = projected.get(a.hash);
          return p && Object.prototype.hasOwnProperty.call(PROJECTIONS, p) ? PROJECTIONS[p](a.content) : a.content;
        })
        .join(' ')
    );
    const actual = normalize(domTextToContent(ownMarkup(html, evidence.blocks, i)));
    if (actual === expected) return;
    const residue = residueOf(actual, expected);
    errors.push(
      residue
        ? `block …${b.hash.slice(0, 8)} carries visible text no atom attests: ${JSON.stringify(residue)}`
        : `block …${b.hash.slice(0, 8)} visible text ${JSON.stringify(actual)} ≠ its atoms ${JSON.stringify(expected)}`
    );
  });
  return { ok: errors.length === 0, errors };
}

// ───────────────────────── 5. THE GATES ─────────────────────────
// The punchline: verification reads NOTHING but the published HTML.
// No substrate, no source, no trust in the publisher. This is what any
// agent — or any sceptic with node installed — can run against the page.
// Six numbered gates on the two faces + the DOM-text rule (gate 5's DOM-side
// counterpart) that pins the VISIBLE text; then, for an artefact declaring v1.3,
// three more that pin composition, geometry and the charter.
//
// The gate set is chosen by the artefact's OWN declared version, not by the
// verifier's: a v1.1 or v1.2 page gets the six gates it was built to meet, and
// gets them unchanged. Returns the list of checks that failed, so a caller with
// no interest in the transcript (the refusal vectors) can compare it.

function verify(path = 'dist/index.html', log = console.log) {
  return report(runGates(readFileSync(path, 'utf8'), log), log);
}

function runGates(html, log = console.log) {
  const fails = [];
  const gate = (n, ok, msg) => {
    log(`  gate ${n} ${ok ? 'PASS' : 'FAIL'} — ${msg}`);
    if (!ok) fails.push(n);
  };

  // Gate 1: the DOM carries the evidence trail at all.
  const evidence = readEvidence(html);
  const domBlocks = evidence.blocks.map((b) => b.hash);
  const domAtoms = evidence.atoms.map((a) => a.hash);
  gate(1, domBlocks.length > 0 && domAtoms.length > 0, 'DOM carries block + atom hashes');

  // Gate 2: the machine face exists.
  const ld = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1]));
  const manifest = ld.find((d) => d['@type'] === 'SstPageManifest');
  gate(2, !!manifest, 'manifest present in <head>');
  if (!manifest) return fails;

  // Gate 3: parity, both directions — same identity SET on both faces.
  //
  // Sets, not multisets (§2.5, P1-A): a page may render one identity many times
  // and the manifest lists it once, so neither face lets a verifier infer
  // placement counts, and neither may try.
  //
  // The REVERSE direction has two rules that a naive "every manifest block
  // hash appears as data-block-hash" misses, and both are load-bearing
  // (SPEC §6.2 gate 3):
  //
  //   · a block is evidenced by its own hash OR by any one of its atoms'
  //     hashes that NO OTHER BLOCK claims — a renderer may attribute at atom
  //     granularity, but an atom rendered inside another block's wrapper is
  //     that block's evidence, not this one's. Page-globally, the fallback let
  //     a block be deleted wholesale and still pass whenever one of its atoms
  //     rendered elsewhere — and under content-addressing a brand name or a
  //     location IS one shared atom, so that was the common case, not a corner;
  //   · head-rendered blocks are exempt: their atoms become <title> / <meta> /
  //     the charter <script>, elements that cannot carry a data attribute at
  //     all. The predicate keys on section/name ALONE (P5.3) — a superposed
  //     head block has no `page` label to match, and keying on one would drop
  //     the exemption from exactly the block that needs it most.
  //
  // Without the exemption this verifier failed gate 3 on every page with a
  // head-rendered SEO block — including the framework's own conformance
  // fixture — while the production gate passed the same bytes. Two verifiers
  // disagreeing about one page is the drift the vectors exist to kill.
  const domBlockSet = new Set(domBlocks);
  const unclaimedAtoms = new Set(evidence.atoms.filter((a) => a.claimedBy === null).map((a) => a.hash));
  const mBlocks = new Set(manifest.blocks.map((b) => b.hash));
  const mAtoms = new Set(manifest.blocks.flatMap((b) => b.atoms.map((a) => a.hash)));
  const forward = domBlocks.every((h) => mBlocks.has(h)) && domAtoms.every((h) => mAtoms.has(h));
  const reverse = manifest.blocks.every(
    (b) =>
      isHeadBlock(b) ||
      domBlockSet.has(b.hash) ||
      b.atoms.some((a) => unclaimedAtoms.has(a.hash))
  );
  gate(3, forward && reverse, 'DOM ⊆ manifest AND manifest ⊆ DOM');

  // Gate 4: the declared page root really is the root of the block list.
  gate(
    4,
    merkleRoot(manifest.blocks.map((b) => b.hash)) === manifest.page_merkle_root,
    'page root recomputes from block hashes'
  );

  // Gate 5: the MANIFEST re-hash — the deepest gate on the machine face. Every
  // manifest atom's content re-hashes to its declared id; every block's declared
  // root recomputes from its atoms' ids in order. (Gate 5 is the MANIFEST side.
  // The visible-text check is NOT gate 5 — that was a live drift in this very
  // kernel's README, the exact class the conformance workstream exists to kill.
  // The visible text is pinned by the DOM-text rule below and by gate 6.)
  //
  // PROJECTED BLOCKS (§2.5, P3) are accepted here as optional fields. A face may
  // render a proper subset of a block's atoms; then `hash` is the root over
  // exactly the atoms rendered (which gate 5 already checks), and the entry MAY
  // name the crystal block it came from. Only ONE of P3's relations is provable
  // from the page alone — a complete projection is its own source — and that is
  // the one checked. `projected_from` on an INCOMPLETE projection points at a
  // block this page does not carry: a pointer for the reader, not a number the
  // verifier can recompute, and it is deliberately not treated as one.
  let manifestOk = true;
  for (const b of manifest.blocks) {
    for (const a of b.atoms) if (atomId(a.content) !== a.hash) manifestOk = false;
    if (merkleRoot(b.atoms.map((a) => a.hash)) !== b.hash) manifestOk = false;
    if (b.projection_is_complete === true && b.projected_from !== undefined && b.projected_from !== b.hash) manifestOk = false;
  }
  gate(5, manifestOk, 'manifest content re-hashes to declared atom + block ids');

  // Gate 6: block completeness — the block contains its atoms and nothing else.
  const complete = blockCompleteness(html, manifest, evidence);
  gate(6, complete.ok, 'every block wrapper reconstructs from its atoms and nothing else');
  for (const e of complete.errors) log(`         · ${e}`);

  // The §6.2 DOM-text rule — gate 5's DOM-side counterpart (a NAMED companion,
  // not a seventh gate). Gate 5 re-hashes the manifest's content strings; it
  // never reads the rendered VISIBLE text, so a page whose visible text was
  // mutated (attributes + manifest intact) still passes gate 5. This closes that
  // gap atom by atom, where gate 6 closes it block by block.
  const domText = domTextRule(html, manifest);
  log(`  DOM-text ${domText.ok ? 'PASS' : 'FAIL'} — visible text re-hashes / projected label recomputes`);
  if (!domText.ok) {
    fails.push('DOM-text');
    for (const e of domText.errors) log(`         · ${e}`);
  }

  // ─────────── VERSION DISPATCH ───────────
  // The artefact names its format; the verifier runs that format's gate set. The
  // version names the manifest SHAPE and the GATE SET together — identities are
  // stable across versions, so an older artefact is not stale, it is older, and
  // the six gates are the whole of what it ever promised.
  //
  // The one thing a version string must not become is a switch that turns checks
  // off: a v1.3 manifest relabelled `1.2` still carries its v1.3 declarations, and
  // silently skipping the gates that check them would let an attacker downgrade a
  // page by editing five characters. So an older version carrying newer fields is
  // itself the refusal.
  const V13_FIELDS = ['placements', 'composition_root', 'geometry'];
  const carried = V13_FIELDS.filter((f) => manifest[f] !== undefined);
  if (manifest.version === '1.1' || manifest.version === '1.2') {
    if (carried.length) {
      fails.push('version');
      log(`  version FAIL — declares ${manifest.version} but carries v1.3 field(s): ${carried.join(', ')}`);
    }
    return fails;
  }
  if (manifest.version !== '1.3') {
    fails.push('version');
    log(`  version FAIL — unknown manifest version ${JSON.stringify(manifest.version)}; this kernel knows 1.1, 1.2 and 1.3`);
    return fails;
  }

  const entryByHash = new Map(manifest.blocks.map((b) => [b.hash, b]));
  const why = [];

  // Gate 7: COMPOSITION — the page's placement transcript, in document order.
  //
  // Gate 3 compares the two faces as SETS and gate 4 recomputes the page root
  // from the manifest's own list, so neither sees order or multiplicity: two
  // blocks swapped, a block printed twice, or one of a superposed pair deleted
  // all passed. The transcript is the missing evidence, and the composition root
  // is what makes the transcript itself tamper-evident.
  const claimed = manifest.placements ?? [];
  if (domBlocks.length !== claimed.length)
    why.push(`gate 7: the page renders ${domBlocks.length} block wrappers, the transcript declares ${claimed.length}`);
  else
    for (let i = 0; i < domBlocks.length; i++)
      if (domBlocks[i] !== claimed[i].block)
        why.push(`gate 7: placement ${i} declares …${claimed[i].block.slice(0, 8)}, the page renders …${domBlocks[i].slice(0, 8)}`);
  const compositionRoot = merkleRoot(claimed.map((c) => placementLeaf(c.block, c.section, c.name)));
  if (compositionRoot !== manifest.composition_root)
    why.push(`gate 7: composition root recomputes to ${compositionRoot.slice(0, 8)}… ≠ declared ${String(manifest.composition_root).slice(0, 8)}…`);

  // That is the whole of gate 7: the sequence, and the root over it. In
  // particular it checks NOTHING about `order`. A block's `order` is a
  // SECTION-LOCAL label — the row's position inside its own section — not a
  // page-wide position, so the printed sequence cannot contradict it, and a
  // verifier that reads it as a page-wide sequence refuses ordinary pages:
  // simulated against the reference implementation's home page, a monotonicity
  // check over the transcript fired 39 times in 58 transitions on a page nobody
  // had touched. `order` is descriptive metadata, declared and not verified, at
  // every version. The coordinate that IS bound is the placement's own (section,
  // name) — not by comparing it against a label, but by hashing it into the
  // composition root above, where an edit to either moves the root.

  gate(7, why.length === 0, 'the page renders exactly the declared placements, in order');
  for (const e of why) log(`         · ${e.replace(/^gate 7: /, '')}`);

  // Gate 8: GEOMETRY FROM THE PAGE — the shape, including its negative space.
  //
  // The geometry spine hashes section, block, block_type, role and occupancy
  // state; the manifest declares the same fields and hashed none of them, so an
  // edited role or a silently dropped vacancy cost nothing. Publishing the page's
  // slice binds the two: the root recomputes from the published sites, and the
  // sites and the PLACEMENTS must describe the same page.
  const geo = manifest.geometry ?? {};
  const sites = Array.isArray(geo.sites) ? geo.sites : [];
  const why8 = [];
  const geoRoot = pageGeometryRoot(manifest.page, sites);
  if (!sites.length) why8.push('the manifest declares no geometry sites');
  else if (geoRoot !== geo.root)
    why8.push(`geometry root recomputes to ${geoRoot.slice(0, 8)}… ≠ declared ${String(geo.root).slice(0, 8)}…`);

  // The published sites are the PLACEMENTS' sites, so the transcript is what they
  // are checked against — never the bill, which is a set of identities and cannot
  // say where anything was printed. Each coordinate the page places, once: a
  // coordinate placed twice declares its sites once, because a site is a
  // coordinate and not an occurrence.
  const placedAt = new Map();
  for (const c of claimed) {
    const key = `${c.section}${US}${c.name}`;
    if (!placedAt.has(key)) placedAt.set(key, { section: c.section, name: c.name, block: c.block });
  }

  // Every site names a coordinate this page places. A site naming anything else is
  // a claim about a different page, and this object is this page's slice.
  for (const site of sites)
    if (!placedAt.has(`${site.section}${US}${site.block}`))
      why8.push(`site ${site.section}/${site.block}/${site.role} names a block this page does not place`);

  // A bill entry may omit the coordinate fields its candidate rows disagree about
  // (P2), and an omitted field makes no claim — so it constrains nothing here. A
  // site and an entry are COMPATIBLE when every claim the entry does make agrees.
  const compatible = (entry, site) =>
    (entry.section === undefined || entry.section === site.section) &&
    (entry.name === undefined || entry.name === site.block) &&
    entry.block_type === site.block_type;

  // Both directions at each placed coordinate: the block printed there carries
  // exactly the roles the present sites declare, and describes itself the way the
  // site does. Head-rendered blocks and the synthesized charter block are placed
  // nowhere, so nothing here reaches them — gate 9 is what binds the charter.
  for (const p of placedAt.values()) {
    const entry = entryByHash.get(p.block);
    if (!entry) continue; // absent from the bill ⇒ already a gate-3 forward failure
    const here = sites.filter((s) => s.section === p.section && s.block === p.name);
    for (const site of here)
      if (!compatible(entry, site))
        why8.push(`the block placed at ${p.section}/${p.name} describes itself differently from the site declared there`);
    const present = new Set(here.filter((s) => s.state === 'present').map((s) => s.role));
    const carried = new Set((entry.atoms ?? []).map((a) => a.role));
    for (const role of carried)
      if (!present.has(role))
        why8.push(`the block placed at ${p.section}/${p.name} carries role "${role}" that no present site declares`);
    for (const role of present)
      if (!carried.has(role))
        why8.push(`site ${p.section}/${p.name}/${role} is present, and the block placed there does not carry it`);
  }

  gate(8, why8.length === 0, 'the page geometry recomputes, and its sites and the blocks it places agree');
  for (const e of why8) log(`         · ${e}`);

  // Gate 9: THE CHARTER — the operator's terms, under the page root.
  //
  // Until v1.3 `verify` never read the charter at all: flipping a permission, or
  // deleting the declaration outright, failed nothing. Now the served terms are
  // hashed by the same rule as any other content and the resulting atom must be
  // the one the charter names, inside a block the manifest carries — which gate 4
  // has already folded into the page root.
  // TWO SHAPES, ONE RULE. This kernel's demo serves a bare `SstCharter` document.
  // A real artefact usually has an entity already — the reference implementation
  // serves `@type: ProfessionalService` — and hangs the charter on it as an
  // `sst_charter` field, because the terms and the thing they govern are one
  // object. A verifier that knew only the first shape would report "no charter" on
  // a page that plainly publishes one, so either is a charter. The manifest is
  // neither, and is not a candidate.
  const charter = ld.find(
    (d) => d && typeof d === 'object' && (d['@type'] === 'SstCharter' || 'sst_charter' in d)
  );
  let why9 = null;
  if (!charter) why9 = 'no charter in <head>';
  else {
    const declared = charter.attestation;
    const atom = atomId(charterAtomContent(charter));
    const entry = declared && entryByHash.get(declared.block);
    if (!declared || typeof declared.atom !== 'string' || typeof declared.block !== 'string')
      why9 = 'the charter declares no attestation';
    else if (atom !== declared.atom)
      why9 = `the served terms hash to ${atom.slice(0, 8)}… ≠ the declared ${declared.atom.slice(0, 8)}…`;
    else if (!entry) why9 = `the attested block …${declared.block.slice(0, 8)} is not in the manifest`;
    else if (!(entry.atoms ?? []).some((a) => a.hash === declared.atom))
      why9 = `the attested atom is not in block …${declared.block.slice(0, 8)}`;
  }
  gate(9, why9 === null, 'the served charter hashes into a block under the page root');
  if (why9) log(`         · ${why9}`);

  return fails;
}

function report(fails, log = console.log) {
  if (fails.length === 0) {
    log('\n✓ Dual-Native: this artefact proves itself.');
    return true;
  }
  log(`\n✗ check(s) ${fails.join(', ')} failed: tampered, out-of-spec, or transitional.`);
  return false;
}

// ───────────────────────── 6. THE TAMPER DEMO ─────────────────────────
// Change one character of one sentence; identity collapses upward.

function tamper() {
  const html = readFileSync('dist/index.html', 'utf8');
  // Mutate the VISIBLE text (the body), not the manifest's copy — the
  // scenario is "what you read is no longer what was signed". Gate 5 (the
  // manifest re-hash) still PASSES — it never reads the body; gate 6 and the
  // DOM-text rule are what catch it. That gap is the whole reason they exist.
  const [head, body] = html.split('</head>');
  const mutatedBody = body.replace('two faces, one identity', 'two faces, one identitY');
  if (mutatedBody === body) throw new Error('tamper target not found — did the build change?');
  writeFileSync('dist/tampered.html', head + '</head>' + mutatedBody);
  console.log('flipped one character of visible text → dist/tampered.html\n');
  verify('dist/tampered.html');
}

// ─────────── 6b. THE SEAL DEMO (the geometry counterpart of tamper) ───────────
// The content root and the geometry root are ORTHOGONAL. Sealing a vacancy
// (_PENDING_ → _NA_OMITTED_, a single-row atom_ref mutation) changes the SHAPE's
// census → the geometry root moves, but no content atom changed → the content
// root HOLDS. Editing an atom is the mirror image: the content root moves, the
// geometry root (coordinate + state unchanged) HOLDS. Two roots, two concerns.

function seal() {
  const { atoms, rows } = readSubstrate();
  const contentRootOf = (a, rs) => merkleRoot(compileBlocks(a, rs).map((b) => b.hash));
  const geoRootOf = (rs) => buildGeometry(rs).root;

  const content0 = contentRootOf(atoms, rows);
  const geo0 = geoRootOf(rows);

  // (a) SEAL the first pending vacancy: _PENDING_ → _NA_OMITTED_ (§4.7.2).
  let sealed = false;
  const sealedRows = rows.map((r) => {
    if (!sealed && occupancyOf(r.atom_ref) === 'pending') { sealed = true; return { ...r, atom_ref: '_NA_OMITTED_' }; }
    return r;
  });
  if (!sealed) throw new Error('no pending vacancy to seal — did the substrate change?');

  // (b) EDIT the first present atom's content (append a full stop).
  const firstReal = rows.find((r) => occupancyOf(r.atom_ref) === 'present').atom_ref;
  const editedAtoms = new Map(atoms).set(firstReal, atoms.get(firstReal) + '.');

  const cSeal = contentRootOf(atoms, sealedRows);
  const gSeal = geoRootOf(sealedRows);
  const cEdit = contentRootOf(editedAtoms, rows);
  const gEdit = geoRootOf(rows);

  const show = (label, c, g) => console.log(`  ${label.padEnd(11)} content ${c.slice(0, 16)}…   geometry ${g.slice(0, 16)}…`);
  console.log('two roots, orthogonal — content attests WHAT IS; geometry attests the SHAPE:\n');
  show('baseline', content0, geo0);
  show('seal hole', cSeal, gSeal);
  show('edit atom', cEdit, gEdit);
  console.log('');

  const sealOk = cSeal === content0 && gSeal !== geo0;
  const editOk = cEdit !== content0 && gEdit === geo0;
  console.log(`  ${sealOk ? '✓' : '✗'} sealing a vacancy MOVED the geometry root and HELD the content root`);
  console.log(`  ${editOk ? '✓' : '✗'} editing an atom MOVED the content root and HELD the geometry root`);
  console.log(sealOk && editOk
    ? '\n✓ the two roots are independent: negative space and content are separately tamper-evident.'
    : '\n✗ the roots are entangled — a spine is reading the wrong substrate.');
  return sealOk && editOk;
}

// ───────────────────────── 7. THE CONFORMANCE VECTORS ─────────────────────────
// Two frozen sets, with two different provenances, proving two different things.
// vectors/README.md states both in full; the short version:
//
//   v1-fixture     — identity ground truth computed by the PRODUCTION
//                    implementation at format v1.1. This kernel re-derives every
//                    value through its OWN primitives. That is the
//                    cross-implementation check, and it is why "SST in miniature"
//                    is a measurement rather than a slogan. v1.2 moved the
//                    manifest shape and the gate set and left identity alone, so
//                    these values are unchanged by the version bump — which is
//                    itself the claim being tested here.
//
//   v1.2-manifest  — the v1.2 MANIFEST SHAPE, frozen by THIS kernel over its own
//                    substrate. No production implementation emits v1.2 yet, so
//                    this set is a freeze, not an agreement: it pins the dedupe
//                    rule, the provenance labels, and the geometry census against
//                    accidental drift. It becomes a cross-implementation check
//                    the day a second implementation reproduces it. It is also a
//                    PROMISE: the older shape is still emitted on demand, so an
//                    artefact built to it keeps verifying exactly as before.
//
//   v1.3-manifest  — the v1.3 shape on the same terms, plus something the other
//                    two sets do not have: a REFUSAL set. Each file is the frozen
//                    page with one edit, and each names the check that must catch
//                    it. A gate nobody has watched refuse is a comment.

function vectors() {
  let ok = true;
  const fail = (msg) => { ok = false; console.log(`  ✗ ${msg}`); };

  // ── v1-fixture: identity, frozen by the production implementation ──
  const base = new URL('vectors/v1-fixture/', import.meta.url);
  const expected = JSON.parse(readFileSync(new URL('expected.json', base), 'utf8'));
  const home = expected.page_manifests.home;

  // 1. Atom identities — SHA-256 of the normalized form reproduces every frozen
  //    atom id (sentinels included: an atom id is just a hash).
  for (const a of expected.atoms) {
    if (normalize(a.normalized) !== a.normalized) fail(`normalize not idempotent for "${a.name}"`);
    if (createHash('sha256').update(a.normalized).digest('hex') !== a.atom_id) fail(`atom_id drift: "${a.name}"`);
  }
  console.log(`  ✓ ${expected.atoms.length} atom ids reproduce from the normalized form`);

  // 2. Content re-hash + composition — every manifest atom's RAW content
  //    re-hashes through this kernel's normalize (smart quotes, NFC, whitespace,
  //    emphasis marks, escaped *, entities-as-content); every block root
  //    recomputes from its atoms; the page root recomputes from the block list.
  //    The single-atom global/footer/connect block proves leaf tagging
  //    (block id = merkleLeaf(atomId) ≠ atomId).
  let na = 0;
  for (const b of home.blocks) {
    for (const a of b.atoms) { if (atomId(a.content) !== a.hash) fail(`content re-hash drift: ${JSON.stringify(a.content)}`); na++; }
    if (merkleRoot(b.atoms.map((a) => a.hash)) !== b.hash) fail(`block root drift: ${b.section}/${b.name}`);
  }
  if (merkleRoot(home.blocks.map((b) => b.hash)) !== home.page_merkle_root) fail('page root drift');
  console.log(`  ✓ ${na} atoms re-hash from raw content; ${home.blocks.length} block roots + the page root recompute (domain-separated Merkle)`);

  // 3. The §6.2 DOM-text rule over the rendered fixture — verbatim, emphasis,
  //    entity, escaped-asterisk, AND the projected enum-label atom (black tie).
  const fixtureHtml = readFileSync(new URL('home.html', base), 'utf8');
  const dom = domTextRule(fixtureHtml, home);
  if (!dom.ok) for (const e of dom.errors) fail(`DOM-text: ${e}`);
  else console.log('  ✓ the §6.2 DOM-text rule holds over the rendered fixture (projected enum-label included)');

  // 3b. Gate 6 over the same page. The fixture was rendered by the PRODUCTION
  //     implementation, before gate 6 existed; if the new gate is a faithful
  //     reading of what a conformant emitter already does, it must pass here
  //     without a byte of the fixture changing.
  const complete = blockCompleteness(fixtureHtml, home, readEvidence(fixtureHtml));
  if (!complete.ok) for (const e of complete.errors) fail(`gate 6: ${e}`);
  else console.log('  ✓ gate 6 (block completeness) holds over the production-rendered fixture');

  // 4. GEOMETRY vectors — build the shape Merkle from the RAW fixture lattice
  //    (sentinels INCLUDED, the negative space is the whole point) and reproduce
  //    the frozen geometry root + census, all four occupancy states included.
  const g = geometryManifest(buildGeometry(parseCsv(new URL('lattice.csv', base))));
  const eg = expected.geometry;
  if (g.geometry_root !== eg.geometry_root) fail(`geometry_root drift: ${g.geometry_root.slice(0, 16)}… ≠ ${eg.geometry_root.slice(0, 16)}…`);
  if (g.site_count !== eg.site_count) fail(`site_count ${g.site_count} ≠ ${eg.site_count}`);
  if (g.block_count !== eg.block_count) fail(`block_count ${g.block_count} ≠ ${eg.block_count}`);
  for (const st of ['present', 'pending', 'na-omitted', 'na-impossible'])
    if (g.states[st] !== eg.states[st]) fail(`states.${st} ${g.states[st]} ≠ ${eg.states[st]}`);
  if (g.geometry_root === eg.geometry_root && g.site_count === eg.site_count && g.block_count === eg.block_count)
    console.log(`  ✓ the geometry root + census reproduce (${g.site_count} sites, ${g.block_count} blocks, ${JSON.stringify(g.states)})`);

  // ── v1.2-manifest: the manifest shape, frozen by this kernel ──
  // Byte-exact JSON comparison on purpose: field order, omitted labels and all.
  // A dedupe that stopped deduping, a label that started guessing, or a version
  // that slipped back to 1.1 each move these bytes.
  const frozen = JSON.parse(readFileSync(new URL('vectors/v1.2-manifest/expected.json', import.meta.url), 'utf8'));
  const built = compileArtefact('1.2');
  if (JSON.stringify(built.manifest) !== JSON.stringify(frozen.page_manifest)) fail('v1.2 page manifest drift — the built manifest is not the frozen one');
  else console.log(`  ✓ the v1.2 page manifest reproduces byte-for-byte (${frozen.page_manifest.block_count} identities, ${frozen.page_manifest.atom_count} atoms, version ${frozen.page_manifest.version})`);
  if (JSON.stringify(built.geometry) !== JSON.stringify(frozen.geometry)) fail('v1.2 geometry manifest drift');
  else console.log(`  ✓ the v1.2 geometry spine reproduces (${frozen.geometry.site_count} sites, ${frozen.geometry.block_count} blocks)`);

  // ── v1.3-manifest: composition, the page's geometry slice, the charter ──
  // Same provenance as v1.2 — a freeze by this kernel over its own substrate. The
  // frozen PAGE is pinned beside the manifest, because the refusal set below is a
  // set of one-character-scale edits to exactly those bytes: a drifted page would
  // quietly make every refusal a test of nothing.
  const f13 = JSON.parse(readFileSync(new URL('vectors/v1.3-manifest/expected.json', import.meta.url), 'utf8'));
  const b13 = compileArtefact('1.3');
  if (JSON.stringify(b13.manifest) !== JSON.stringify(f13.page_manifest)) fail('v1.3 page manifest drift — the built manifest is not the frozen one');
  else console.log(`  ✓ the v1.3 page manifest reproduces byte-for-byte (${f13.page_manifest.block_count} identities, ${f13.page_manifest.placements.length} placements, ${f13.page_manifest.geometry.sites.length} sites, version ${f13.page_manifest.version})`);
  if (JSON.stringify(b13.charter) !== JSON.stringify(f13.charter)) fail('v1.3 charter drift — the attestation is not the frozen one');
  else console.log('  ✓ the v1.3 charter reproduces, naming the atom and the block that attest its terms');

  const frozenPage = readFileSync(new URL('vectors/v1.3-manifest/page.html', import.meta.url), 'utf8');
  if (renderPage(b13) !== frozenPage) fail('v1.3 page drift — the built page is not the one the refusal set mutates');
  else if (runGates(frozenPage, () => {}).length) fail('the frozen v1.3 page does not pass its own gates');
  else console.log('  ✓ the frozen v1.3 page rebuilds byte-for-byte and passes all nine gates + the DOM-text rule');

  // The SECOND CHARTER SHAPE, frozen as a page rather than derived: the same terms
  // served the way a real artefact serves them — an entity document carrying an
  // `sst_charter` field — with its attestation block re-derived by the same
  // canonical rule. This kernel emits the bare-document shape, so this vector is
  // cut by hand; what it pins is that ONE rule reads BOTH shapes. Its flipped
  // sibling in refusals/ pins the other half: that the shape is checked rather
  // than merely found, since a charter that is not found also fails gate 9.
  const fieldPage = readFileSync(new URL('vectors/v1.3-manifest/page-sst-charter-field.html', import.meta.url), 'utf8');
  const fieldFails = runGates(fieldPage, () => {});
  if (fieldFails.length) fail(`the second charter shape does not pass its own gates: [${fieldFails.join(', ')}]`);
  else console.log('  ✓ a charter served as an sst_charter field on an entity passes all nine gates');

  // The REFUSAL set. Each case must fail EXACTLY the check it names — a gate that
  // stops refusing, refuses something else, or refuses two things at once all move
  // these values. All but the control passed all six gates of the previous version
  // untouched, which is why they exist; the control is one the previous version
  // already caught, and must still be caught in the same place.
  const refusals = JSON.parse(readFileSync(new URL('vectors/v1.3-manifest/refusals/expected.json', import.meta.url), 'utf8'));
  let refused = 0;
  for (const c of refusals.cases) {
    const got = runGates(readFileSync(new URL(`vectors/v1.3-manifest/refusals/${c.file}`, import.meta.url), 'utf8'), () => {});
    if (JSON.stringify(got) !== JSON.stringify(c.refuses)) fail(`refusal drift: ${c.file} failed [${got.join(', ')}], expected [${c.refuses.join(', ')}]`);
    else refused++;
  }
  if (refused === refusals.cases.length) console.log(`  ✓ ${refused} refusal vectors each fail exactly the check they name`);

  console.log(ok
    ? `\n✓ sst-kernel reproduces the v1-fixture identity vectors (${expected.format}) and its own ${frozen.format} and ${f13.format} manifest vectors.`
    : '\n✗ sst-kernel DIVERGES from the conformance vectors — a primitive or a rule drifted.');
  return ok;
}

// ─────────── THE root VERB — recompute a published root by hand ───────────
// Both composed roots the manifest declares are `merkleRoot` over a list the
// manifest also publishes, so a sceptic should not have to write code to check
// one. Hand this verb the manifest's `blocks` array and it prints the page root;
// hand it the `placements` array and it prints the composition root. A bare JSON
// array of 64-character hashes works too — that is what a leaf list looks like
// coming out of any other implementation.

function rootOf(path) {
  if (!path) throw new Error('usage: node sst-kernel.mjs root <json-file>');
  const items = JSON.parse(readFileSync(path, 'utf8'));
  if (!Array.isArray(items)) throw new Error('expected a JSON array of hashes, blocks, or placements');
  const leaves = items.map((it, i) => {
    if (typeof it === 'string') {
      if (!/^[0-9a-f]{64}$/.test(it)) throw new Error(`item ${i}: not a 64-character hex hash`);
      return it;
    }
    if (it && typeof it.hash === 'string') return it.hash;          // a manifest block
    if (it && typeof it.block === 'string' && typeof it.section === 'string' && typeof it.name === 'string')
      return placementLeaf(it.block, it.section, it.name);          // a placement
    throw new Error(`item ${i}: neither a hash, a block entry, nor a placement`);
  });
  console.log(merkleRoot(leaves));
  return true;
}

// ───────────────────────── CLI ─────────────────────────

const cmd = process.argv[2] ?? 'build';
if (cmd === 'build') build();
// verify's exit code IS its verdict — a sceptic pipes this into CI. Reporting
// FAIL on stdout while exiting 0 would make the verifier agree with everything.
else if (cmd === 'verify') process.exit(verify(process.argv[3]) ? 0 : 1);
else if (cmd === 'tamper') tamper();
else if (cmd === 'seal') process.exit(seal() ? 0 : 1);
else if (cmd === 'vectors') process.exit(vectors() ? 0 : 1);
else if (cmd === 'root') rootOf(process.argv[3]);
else console.log('usage: node sst-kernel.mjs [build|verify <file>|tamper|seal|vectors|root <json-file>]');
