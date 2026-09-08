# SST — Single Source of Truth: a self-verifying, sovereign content format

**White-paper SKELETON.** This is the outline the full paper grows into, not the
paper itself. It is planted here and grown post-launch, because the argument is
only worth writing down once the format is frozen (the conformance vectors) and
the reference implementations agree (production + the kernel).

Each section below states **what it must establish** and points at the **canon**
that already contains the material — SPEC (normative), COMPANION (rationale),
GLOSSARY (definitions), the conformance vectors (`vectors/v1-fixture/`), and
`sst-kernel.mjs` (the ten-minute reference). Writing the paper is turning these
pointers into prose; it is not new research. Nothing here is normative — when
this skeleton and SPEC disagree, SPEC wins.

**Pointers, and where they lead.** SPEC, COMPANION, GLOSSARY and the reference
implementation's source paths are named throughout as the canon
each section draws on. They are **not in this repository** — the public
specification is forthcoming, and this skeleton is published now because the
argument it points at should be checkable in outline before it is written out.
What IS here is every pointer that matters for verification: `sst-kernel.mjs`,
`substrate/`, and `vectors/`. Anything you cannot check from those, treat as a
claim awaiting its paper.

**Audience:** developers building sovereign artefacts for operators, and the
researchers / standards readers who need to know the model is sound. **Thesis in
one line:** *published content should be a measurement, not a claim — and the
measurement should belong to the operator, not the platform.*

---

## Abstract (write last)

One paragraph: the problem (content as unverifiable claim, authored on rented
land), the move (identity from content + Merkle composition + a dual-native,
self-verifying artefact + sovereignty declared as data + a second root over the
negative space), and the evidence (a production site, a miniature reference, and
frozen conformance vectors both reproduce byte-for-byte). Source: this whole
document, compressed.

## Part I — The problem: content as a claim on rented land

- **§1.1 The rig-economy thesis.** Why the value has moved from making content to
  owning the rig that distributes it, and what that costs the maker.
  *Sources:* COMPANION → "The rig-economy thesis", "Sovereignty as economic position".
- **§1.2 The Landlord Trap.** Building your identity inside a platform means the
  platform owns the identity; leaving means losing it.
  *Sources:* COMPANION → "The Landlord Trap", "Why platforms cannot replicate SST".
- **§1.3 Claim vs measurement.** Today you *trust* that what you read is what was
  written. SST replaces the trust with a re-computable measurement.
  *Sources:* README.md "The idea"; SPEC §6.2.

## Part II — The idea in miniature (the on-ramp)

The gentle first pass — the whole model in one dependency-free script the reader
can run. The paper earns the formalism of Part III by first showing it working.
*Sources:* `sst-kernel.mjs` (build / verify / tamper / seal / vectors);
README.md in full. This part **is** the README, expanded.

## Part III — The formal model: identity and composition

- **§3.1 Atoms — identity from content.** `atom_id = SHA-256(normalize(content))`;
  the fixed normalization rule (trim · collapse · smart-quote fold · NFC) and why
  each step is load-bearing; the atom-granularity rule (cite/verify/address, not
  the smallest divisible unit). *Sources:* SPEC §2.1, §2.2; GLOSSARY (Atom,
  Content hash); vectors atom cases.
- **§3.2 Blocks and pages — Merkle composition.** Block id = Merkle root over
  atom ids in canonical order; page root over block ids; the domain-separated
  (RFC 6962-style) construction and what it buys (single-leaf ≠ leaf, partial
  proofs, second-preimage defence). *Sources:* SPEC §2.3, §2.4; `merkleLeaf` /
  `merkleNode` / `generateMerkleRoot`.
- **§3.3 The page manifest.** The machine face: JSON-LD in `<head>`, minimal
  fields, Manifest–DOM parity (evidence-based inclusion, the SEO head exemption).
  *Sources:* SPEC §2.5, §2.6.
- **§3.4 Dual-Native physics.** Two faces, one derived from the other, so they
  cannot drift; the DOM as evidence trail; one atom = one element.
  *Sources:* SPEC §2.6, §2.7; COMPANION → "Dual-Native physics".
- **§3.5 The inline vocabulary and projected atoms.** Emphasis is content; links
  are edges; a projected atom (`enum-label`) is a deterministic display of its
  canonical content, verified by recompute against a closed registry.
  *Sources:* SPEC §2.1 (atom content vocabulary), §6.2 (projected atoms).

## Part IV — Composition without matter: the lattice

- **§4.1 Substrate ↔ Construct.** Content lives once (atoms.csv); placement is a
  separate table (lattice.csv); "row order is meaning; sorting is editing."
  *Sources:* SPEC §4.1, §4.3; COMPANION → "The lattice", "Substrate ↔ Construct".
- **§4.2 Data Superposition.** One atom, N placements — numerically one, not
  merely indistinguishable; the hash-consing lineage; why it's stronger than the
  physical metaphor. *Sources:* COMPANION → "Data Superposition"; GLOSSARY.
- **§4.3 Components as projections.** Renderers are declarative; they consume
  compiled constructs and emit the evidence attributes; no data-fetching, no
  path-construction. *Sources:* SPEC §4.3.6; COMPANION → "Components as construct
  projections".

## Part V — The crystal: proving the negative space

- **§5.1 Typed vacancy.** A vacant site is a row pointing at a reserved sentinel
  (pending / na-omitted / na-impossible), not a missing row; sealing is a
  single-row mutation. *Sources:* SPEC §4.7.2; `src/data/sentinels.ts`;
  COMPANION → "The never-finished crystal".
- **§5.2 The content-spine filter (the load-bearing rule).** Sentinels feed only
  the geometry spine; they must never enter a block id, the manifest, or the DOM.
  *Sources:* SPEC §4.7.2; vectors `_PENDING_`-in-a-mixed-block case; the kernel's
  `compileBlocks`.
- **§5.3 The geometry root.** A second Merkle root over shape-coordinates valued
  by occupancy-state; matter-invariant; a tamper-evident census of known-unknowns.
  The `seal` demo proves content and geometry roots orthogonal.
  *Sources:* `lattice/compiler/geometry-spine.ts`; the kernel's `buildGeometry` /
  `seal`; the geometry vectors.
- **§5.4 The three faces.** Authoring (red ghosts nag), operator, public —
  projection states and honest public depth. *Sources:* COMPANION → "The three
  faces"; SPEC §4.7.2.

## Part VI — Sovereignty, trust, and time

- **§6.1 Sovereignty as data.** The charter: all six universal permission
  categories declared in `<head>`; legibility, not enforcement ("violation is
  legible; boundaries are verifiable"). *Sources:* SPEC §1.4, §5.1; COMPANION.
- **§6.2 The trust model.** The gates prove internal consistency relative to the
  canonical origin (DNS + TLS), not authorship; the forbidden-language discipline;
  SST-SIG (Ed25519 over the roots, key in DNS) as the designed extension.
  *Sources:* SPEC §6.5; README.md "What the proof covers".
- **§6.3 Temporality.** The substrate is a snapshot; living artefacts delegate
  history to version control; versioned artefacts keep superseded manifests
  addressable; citation = content hash + optional version pin. *Sources:* SPEC §2.10.

## Part VII — Conformance and portability (the falsifier)

- **§7.1 Ground truth as vectors.** Prose drifts (it drifted inside the repo);
  byte-exact vectors any implementation must reproduce are the only binding.
  *Sources:* `vectors/v1-fixture/` (fixture, expected.json,
  gates, render).
- **§7.2 Two implementations, one identity.** Production and this kernel reproduce
  the same content + geometry roots byte-for-byte. *Sources:* `validateConformanceVectors`;
  `sst-kernel.mjs vectors`.
- **§7.3 The cold-rebuild test.** A cold agent handed only the substrate rebuilds
  to identical roots on any stack (content spine → visual parity → byte identity).
  *Sources:* to be written.

## Part VIII — The operator OS and domain profiles

- **§8.1 Operator OS.** Local-first write surface, read-only public deploy, the
  artefact as an evolving object the operator owns end to end. *Sources:* SPEC
  §4.7.1; COMPANION → "Operator OS".
- **§8.2 Domain profiles.** Portfolio service trades (the reference site) and
  authored long-form as two shapes of the same substrate. *Sources:* COMPANION →
  Part V; charter.yaml.

## Part IX — Intellectual history and related work

- **§9.1 Lineage.** Triad → Quartet → Stencils; how identifier discipline and
  Dual-Native emerged. *Sources:* COMPANION → Part IV.
- **§9.2 Related work.** Merkle trees / certificate transparency (RFC 6962),
  content-addressed storage (Git, IPFS), hash-consing / persistent data
  structures, JSON-LD / structured data, C2PA and provenance signatures — what
  SST borrows and where it diverges (identity from *normalized content*, the
  operator as root of sovereignty, the negative-space root). *Sources:* to be
  written; COMPANION → "Data Superposition" names the CS lineage.

## Appendices

- **A. The normalization rule and vector table** (the sharp cases: smart quotes,
  NFC, whitespace, emphasis, escaped `*`, entities, superposition, single-atom
  block, projected atom). *Source:* `vectors/v1-fixture/`.
- **B. The Merkle construction** (domain-separated pseudocode + the single-leaf
  invariant). *Source:* SPEC §2.4; `atomCompiler`.
- **C. The gates and the DOM-text rule** (the nine gates + gate 5's DOM-side
  companion, incl. projected-atom recompute, and the version dispatch that decides
  which gates an artefact gets). *Source:* SPEC §6.2; `validateHallmark`.
- **D. The kernel** — the entire reference implementation, annotated. *Source:*
  `sst-kernel.mjs`.

---

*SST — Peter Russell. White-paper skeleton, 2026. Grows post-launch. Not
normative; SPEC is the authority.*

*Licensed CC BY 4.0 — see LICENSE-DOCS. Attribution: Peter Russell · SST —
Single Source of Truth.*
