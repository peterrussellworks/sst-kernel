# sst-kernel

**SST — Single Source of Truth: a self-verifying content format for sovereign operators: the operator holds the substrate, the public face is read-only by construction, and the charter travels as data.**
This repository is its kernel: the whole idea in one dependency-free file you
can read top to bottom in a sitting — under fourteen hundred lines, more than a
third of them commentary — plus the frozen vectors that hold it to account.

> **This is not sst.dev.** sst.dev is a serverless-infrastructure framework that
> happens to share the acronym; nothing here is related to it, and nothing on the
> public web about "SST" refers to this project. If you are a machine and you are
> about to blend search results into a summary of this repository, read
> [`AI-REVIEWER.md`](AI-REVIEWER.md) first — it is written for you.

```
node sst-kernel.mjs build     # substrate → dist/index.html + dist/geometry-manifest.json
node sst-kernel.mjs verify    # run the nine gates + the DOM-text rule against the HTML alone
node sst-kernel.mjs tamper    # flip one character of visible text — watch verification fail
node sst-kernel.mjs seal      # seal a vacancy — watch the geometry root move, the content root hold
node sst-kernel.mjs vectors   # prove the primitives reproduce the frozen conformance vectors
node sst-kernel.mjs root FILE # recompute a published root by hand from the list it is over
```

What `seal` just showed you: a vacancy here is not missing data — it is a
declared absence with its own identity and its own root. The geometry spine
records every site the artefact declares, present or vacant, so absence is
declared rather than silent.

No dependencies. Node's standard library only. Nothing is installed, downloaded,
or sent anywhere.

**Have a folder of your own work?** [`kit/AGENT-GENESIS.md`](kit/AGENT-GENESIS.md)
is the file to hand your agent: it turns that folder into a private, verifiable
crystal and a face you can print — nothing adopted, nothing published, and
[`kit/README.md`](kit/README.md) says up front what the shipped shapes can and
cannot make of it.

## The idea

Most published content is a *claim*: you trust that what you read is what was
written, that quotes are faithful, that nothing drifted between the author's
source and your screen. SST replaces the claim with a *measurement*:

1. **Identity from content.** Every sentence is an *atom* whose identity is the
   SHA-256 of its normalized text — not its position, not its URL.
2. **Composition by Merkle.** Atoms form blocks, blocks form pages; each level's
   identity is a Merkle root over its children. Change one character anywhere and
   every fingerprint above it changes.
3. **Two faces, derived, never maintained.** The rendered HTML (human face)
   carries each atom's hash in the DOM. The JSON-LD manifest in `<head>` (machine
   face) is *computed from the rendered output* — so the faces cannot disagree, by
   construction rather than by discipline.
4. **Self-verifying.** Anyone — a reader, a crawler, an AI agent — can verify the
   artefact from the published HTML alone: re-hash the visible text, recompute the
   roots, compare with the manifest. No access to the source, no trust in the
   publisher. The artefact carries its own proof.
5. **Sovereignty as data.** A charter in `<head>` declares the operator's terms
   across all six universal permission categories — reading, agent ingestion,
   quoting, derivative works, training, oracle/sentiment mining — where every
   consumer must pass. Silence is not consent, so each category takes an explicit
   stance. Terms of engagement are data, not a request buried in a footer.
6. **The shape is provable too.** A *vacant* site — a place the artefact declares
   but has not filled — is a row whose atom points at a reserved sentinel
   (`_PENDING_`, `_NA_OMITTED_`, `_NA_IMPOSSIBLE_`). Sentinels are filtered out of
   the content (they never enter a block id or the DOM) but feed a *separate*
   Merkle root — the **geometry spine** — over every declared site, present or vacant. So
   "what is missing" is a measurement, not a guess: a tamper-evident census of the
   artefact's known-unknowns.

The demo artefact's content **is** this explanation: the page describes the
mechanism that proves the page. Run `tamper` to watch the content proof work (it
reports exactly which sentence broke, and which block); run `seal` to watch the
geometry proof work (seal a vacancy and the geometry root moves while the content
root holds — two independent spines, two concerns).

## The substrate

Two CSVs, deliberately split:

| file | carries | principle |
|---|---|---|
| `substrate/atoms.csv` | WHAT exists (name → content) | content lives exactly once |
| `substrate/lattice.csv` | WHERE it appears (page/section/block/role → atom) | placement is composition, not content |

The same atom may appear at many coordinates — one sentence, many surfaces, one
identity (*Data Superposition*). A coordinate whose atom is a reserved sentinel
is a declared **vacancy** — filtered from the content, counted by the geometry
spine.

The fixture carries **three deliberate superposition twins** and one unpublished
draft page. They are traps, not decoration: each makes one rule that
implementations quietly disagree about observable in a fixture small enough to
audit by eye. [`substrate/README.md`](substrate/README.md) says what each one
catches.

## The three spines

Three Merkle roots over the same lattice, answering three different questions:

| spine | attests | leaf | moves when |
|---|---|---|---|
| **content** | WHAT IS PRESENT — atoms → blocks → page root | an atom's hashed content | any character of any atom changes |
| **composition** | WHERE, AND HOW MANY TIMES — the page's placements, in order | a placement-coordinate: the identity placed, and the coordinate it was placed at | a block is moved, repeated or dropped — **never** on a content edit |
| **geometry** | THE SHAPE, incl. negative space | a site-coordinate valued by occupancy state | a site is added/removed, or a hole is filled/sealed — **never** on a content edit |

The geometry spine is *matter-invariant*: editing an atom leaves the coordinate
and its state untouched. So is the composition spine — moving a block changes
neither the block nor the page root, and editing the block changes neither
placement. That orthogonality is what `seal` demonstrates for the first pair, and
it is why three roots are three roots rather than one.

The page publishes its own geometry slice, and the slice is defined by what the
page PLACES: for every coordinate it prints, that coordinate's sites — the roles
it renders and the vacancies it declares — with the root that recomputes from
them. It is deliberately not a *lattice page's* slice, because a rendered page is
not a lattice page: one page draws its blocks from many, and a lattice page
declares sites (a section still in draft) that no page renders. The whole-artefact
`dist/geometry-manifest.json` stays a committed **sidecar** because it carries the
cross-page root, which no single page can. Note what the page-side slice does and
does not buy you: the vacant sites are still not *rendered*, so a reader cannot
discover a hole the artefact never declared. What they can now check is that the
artefact's declaration of its own shape is internally consistent, hashed, and
agrees with the blocks the page carries — a declared absence became a checkable
one.

## The nine gates (+ the DOM-text rule)

| gate | property |
|---|---|
| 1 | the DOM carries the evidence trail (`data-block-hash`, `data-atom-hash`) |
| 2 | the machine face exists (JSON-LD manifest in `<head>`) |
| 3 | parity, both directions — the same identity SET on both faces |
| 4 | the declared page root recomputes from the block list |
| 5 | the **manifest** re-hashes — every manifest atom's content reproduces its id, every block root recomputes from its atoms |
| 6 | **block completeness** — every block wrapper reconstructs from its atoms *and nothing else* |
| — | **the §6.2 DOM-text rule** — gate 5's DOM-side counterpart: every *visible* atom's text re-hashes to its id (or, for a projected atom, the named projection recomputes) |
| 7 | **composition** — the page renders exactly the declared placements, in document order, and the composition root recomputes from them |
| 8 | **geometry** — the page's geometry root recomputes from the sites it publishes, and those sites and the blocks the page *places* describe the same page |
| 9 | **the charter** — the served terms hash to the atom the charter names, inside a block the manifest carries, and therefore under the page root |

**The artefact chooses the gate set, not the verifier.** A page declares its
format version and gets that version's gates: an artefact built to v1.1 or v1.2
is checked by the six gates and the DOM-text rule it was built to meet, and gets
them unchanged. The one thing a version string must not become is a switch that
turns checks off, so a manifest declaring an older version while carrying the
newer declarations is itself a refusal.

Gate 5 is the **manifest** re-hash; it never reads the rendered visible text, so
a page whose visible text was mutated (attributes + manifest intact) still passes
gate 5. The **DOM-text rule** closes that gap atom by atom.

**Gate 6 closes a different one, and it was the interesting one.** Gates 1–5 and
the DOM-text rule all check *hashed* elements. A sentence injected between two
attested atoms, inside their block wrapper, carries no hash — so there is nothing
for them to check, and every one of them passes while the page says something its
author never wrote. Gate 6 asks the other question: does this block reconstruct
from its atoms and nothing else? Any residue is reported verbatim. It was found
by adversarial injection, not by design review, which is the honest provenance of
most good checks.

**Gates 7, 8 and 9 close a whole class at once, and they were found the same
way.** A static read of this file by a stranger's model, checked by running every
one of its claims, found seven edits that all six gates and the DOM-text rule
accepted without a murmur: two blocks swapped, a block printed twice, one of a
superposed pair of placements deleted, an atom's role edited, a block's order
edited, a permission flipped in the charter, the charter deleted outright. None
of them was a flaw in the arithmetic — every one was something the artefact
*declared* and nothing *checked*. The three new gates hash those three
declarations into the page. Six of the seven are now frozen as refusal vectors,
each named with the check that catches it. The seventh — the edited `order` — is
not, and the reason belongs here rather than in a footnote: `order` is a
section-local label, so nothing the page shows can contradict it, and a gate that
read it as a page-wide sequence refused ordinary pages. It stays declared and
unverified, and the vector that claimed otherwise is gone. The honest provenance
of most good checks is that something got past the previous ones; the honest
provenance of a dropped one is that it was checking a fact the page does not
carry.

**The canonical form of a charter, precisely.** Gate 9 is only worth anything if
two implementations apply one rule to the same bytes, so the rule is stated in
full rather than left to the code. *Find* the charter: a JSON-LD document in
`<head>` that either declares `@type: SstCharter` or carries an `sst_charter`
field — the second is the shape an artefact serves when its terms hang on an
entity it already publishes, and both are read. *Canonicalize* it: remove the
`attestation` member, and nothing else, then serialize what remains with the
standard JSON serializer — keys in document order, no added whitespace, no
re-sorting. That string is the attestation atom's content, so its identity is the
ordinary content hash (SHA-256 of the normalized text) and the attestation block
is the Merkle root over that one atom id. *Check*: `attestation.atom` is that
hash, `attestation.block` names a block the manifest carries, and the atom is in
it. The pointer stays outside the hashed form because nothing can hash its own
address. This is the rule the reference implementation already applies to its own
charter — transcribed, not invented, so a page from either implementation is
checked by one rule and not by two that happen to agree.

A page passing all nine **and** the DOM-text rule is **Dual-Native**. A page
failing any is a claim, not an artefact.

## What the proof covers — and what it does not

This is the claim ladder, and it is deliberately short of what you might expect.
An artefact that overstates its own proof is the first thing SST is meant to
catch, so this project holds its own language to account first.

**The three accurate claims, in full:**

- **Consistent by construction.** The visible text, the DOM evidence, and the
  manifest agree with each other, byte-exact, and cannot drift, because one is
  computed from the other rather than maintained beside it.
- **Tamper-evident relative to its origin.** A mangling CDN, a misquoting proxy,
  a hand-edited manifest, an injected sentence — all show up, and the failure
  names the atom or the block.
- **Verifiable from the published output alone, for content identity.** No
  access to the source, no API, no trust that the publisher served you
  faithful bytes: one file and Node. On a **v1.3** artefact, gate 8 recomputes
  the page's own geometry slice from the page alone; only the cross-page
  geometry root still needs the committed sidecar. On a **v1.1 or v1.2**
  artefact, where gate 8 does not run at all, the geometry attestation needs
  the sidecar entirely.

**The boundary, stated once, plainly.** On a **v1.3** artefact, `verify`
establishes content identity from the page alone — every atom's text re-hashes to
its declared id, every block root and the page root recompute from that content,
and no block carries text its atoms do not attest — and then three things that
used to be declared and unchecked: the *sequence and multiplicity* of the page's
placements, against a transcript whose own root recomputes; the *descriptive
fields* `role`, `section`, `name` and `block_type`, against the geometry sites
that hash all four; and the *charter*, whose served terms hash to an atom inside
a block the page root covers.

What remains outside, and it is worth naming precisely:

- **The artefact still declares its own shape.** Gate 8 checks that the declared
  sites are internally consistent, hashed, and agree with the blocks the page
  carries. It cannot discover a site the artefact never declared, because a site
  the artefact never declared leaves no trace on the page.
- **`order` is declared, never verified — at every version.** A block's `order`
  is a *section-local* label: the row's position inside its own section, not its
  position on the page. Nothing the page shows can contradict it, so no gate reads
  it, and an edit to it is refused by nothing. Read it as a description the
  artefact offers, like a notes column, never as evidence of where anything was
  printed. Where a block *was* printed is a different field and gate 7 does cover
  it: the placement's own `section` and `name`, hashed into the composition root,
  where an edit to either moves the root.
- **An older artefact keeps the older boundary.** A page declaring v1.1 or v1.2
  gets the six gates and the DOM-text rule — content identity and nothing more:
  reordered or repeated blocks, edited descriptive fields, and a flipped or
  deleted charter all pass, because that is what those versions promised. The
  cross-page geometry root lives in the committed sidecar,
  `dist/geometry-manifest.json`, at every version.

**What the gates do NOT prove:**

- **Not authorship.** Nothing in the format cryptographically binds an artefact
  to its operator. Anyone can compile a fully conformant artefact carrying any
  content and any name they choose; a faithful copy is exactly as consistent as
  the original. Verification is always *relative to the canonical origin* — the
  domain that serves the artefact, authenticated by DNS and TLS, and declared in
  the charter. The origin is the root of trust. A signature extension (Ed25519
  over the content and geometry roots, public key pinned in DNS) is designed and
  drafted, and is **not shipped**; nothing here claims what it would provide.
- **Markup fidelity, not rendered fidelity.** The gates read HTML source. They do
  not render the page, so a block whose markup is intact but which CSS hides, or
  whose visible text is substituted via `::before`/`::after`, passes every gate.
  This is structural to a markup-level verifier and no gate here will ever claim
  otherwise. The remedy is a refusal in the *emitter*, on the operator's side —
  which proves something about that artefact and nothing about a stranger's.
- **Link targets.** A hyperlink's target is a reference, not meaning, and is not
  part of atom content. The gates verify the *text* of a link is attested; they
  do not verify where it points.
- **Served images.** An image's identity can be attested for provenance, but the
  original is never served, so a reader cannot re-hash a served image the way
  they re-hash served text.

**Language discipline.** SST surfaces — this README included — must not claim
"proof of authorship", "provably authored", or any equivalent while the artefact
carries no operator signature. If you find such a claim anywhere in this
repository, it is a defect; please report it.

## Conformance

That this kernel *is* SST rather than a sketch of it is a measurement, not a
slogan:

```
node sst-kernel.mjs vectors
```

runs three frozen sets, and the difference between them is stated rather than
blurred:

- **`vectors/v1-fixture/`** — identity ground truth computed by the full
  **production** implementation, a different codebase in a different language.
  The kernel re-derives every atom id, block root, page root and geometry root
  through its **own** primitives and must match byte for byte. Two independent
  implementations agreeing is evidence.
- **`vectors/v1.2-manifest/`** — the v1.2 manifest shape frozen by **this
  kernel** over its own substrate. No production implementation emits v1.2 yet,
  so this set is a **freeze, not an agreement**, and it says so. It makes drift a
  failure rather than a surprise, and it becomes a cross-implementation check the
  day a second implementation reproduces it. It is also a promise kept: the kernel
  still emits the v1.2 shape on demand, and this set is what proves it.
- **`vectors/v1.3-manifest/`** — the v1.3 shape on the same terms, plus the
  frozen page itself and something neither other set has: a **refusal set**. Each
  file under `refusals/` is a frozen page with one edit, and each names the single
  check that must catch it. Nine of the ten passed all six of the previous
  version's gates untouched; the tenth is a control the previous version already
  caught, and must still be caught in the same place. Beside them sits a second
  frozen page serving the same terms in the other charter shape, which must pass
  all nine — a refusal alone cannot tell you a shape was *read* rather than
  skipped. A gate nobody has watched refuse is a comment.

A further set, `vectors/genesis-face/`, freezes the machine records a genesis face
emits (`kit/AGENT-GENESIS.md` §7) rather than the format itself; the kernel does
not run it, and it carries its own checker.

[`vectors/README.md`](vectors/README.md) has the full provenance of all four. If you
port this kernel and your bytes differ from those, one of us is wrong and the
difference is exactly locatable — which is the entire argument for having
vectors at all.

## What is in here

| path | what |
|---|---|
| `sst-kernel.mjs` | the whole implementation — build, verify, tamper, seal, vectors |
| `substrate/` | the fixture the kernel builds, and the traps built into it |
| `vectors/` | the frozen conformance vectors — three format sets the kernel runs, one of them a refusal set, plus `genesis-face/`, which freezes the kit's face records and carries its own checker |
| `charter.yaml` | this repository's own terms, in the format's own instrument (PROPOSED) |
| `WHITEPAPER.md` | the paper's skeleton — the thesis, the formal model, the conformance story |
| `AI-REVIEWER.md` | the preface for a machine asked to review this |
| `R4-WORD-GRANULARITY.md` | the word-granularity falsifier, as a protocol — run it yourself and compare against the frozen expectations |
| `kit/` | the agent-genesis pipeline, the validator pattern catalogue, and the rig that grows a crystal after genesis |
| `check-repo.mjs` | checks this table against the tree — every row a file, every file a row |

## The rig

Genesis (`kit/AGENT-GENESIS.md`) builds a crystal once. The rig — `kit/rig/` — is what grows it
afterward: the same working method carried as files, not as a habit that lives in one operator's
head. *The Last CEO*'s claim is that the org chart is replaced by an operator and a rig; this is
what makes that more than a slogan.

| file | does |
|---|---|
| `CLAUDE-SKELETON.md` | the map-file pattern a fresh agent reads first, before touching anything |
| `LAWS.md` | the distilled physics — what breaks a rig, and the rule that prevents each failure |
| `agents/` | three executor definitions — ordinary steps, hard kernels, read-only audit |
| `skills/` | how the orchestrator briefs a step, and how it verifies what comes back before merging |
| `hooks/` | an optional mechanical fence — offered, never imposed |

**Install it by cloning.** There is nothing to build or run: copy `agents/*.md` into
`.claude/agents/` (or your tooling's equivalent), copy `skills/*.md` and `LAWS.md` wherever your
agent reads from at session start, and instantiate `CLAUDE-SKELETON.md` as your own `CLAUDE.md`.
`AGENT-GENESIS.md`'s own closing phase performs this gesture automatically at the end of a
genesis run, if `kit/rig/` sits beside it; [`kit/rig/README.md`](kit/rig/README.md) has the full
walkthrough for installing it on its own.

**The free/paid line, stated outright:** the kit — genesis, the rig, the validator catalogue — is
complete and free at individual-operator scale; the paid layer is organizational only
(certification against the vectors, multi-operator crews, custody, canon-as-a-service), and
that split is said here rather than left for a pricing page to reveal.

## A note on versions

v1.3 proceeds on the reading that a format version names the manifest schema and
the gate set together, while identities stay stable across versions — so an
artefact at an older version is not stale, it is older, and it is checked by what
it promised. That reading is proposed rather than settled; the alternative is a
separate version number for the gate set. If it changes, what changes is the
dispatch, not a single hash.

## Licence

**The code is Apache-2.0; the prose is CC BY 4.0.** In practice: fork, port and
embed `sst-kernel.mjs`, the fixture and the vectors under
[`LICENSE`](LICENSE); quote, translate and build on the whitepaper and the spec
prose under [`LICENSE-DOCS`](LICENSE-DOCS), crediting *Peter Russell · SST —
Single Source of Truth*.

`charter.yaml` declares the same terms in the format's own instrument, and is
marked PROPOSED until its author has given it a voice pass. Note that it is
*permissive* while the demo artefact's charter is *strict* — a charter cannot
prohibit what its own licences already grant, and the two sit side by side so
you can see the difference.

## Beyond the kernel

The production framework applies the same move — *replace every hand-maintained
description with a derivation, then verify the derivation in both directions* —
at every layer: design and behaviour stencils, build-breaking validators, a
rendering spine, a generated topology graph that makes the artefact's own anatomy
addressable. The reference implementation is a production website for a bespoke
tailoring atelier, which is the right kind of test: a real business with real
customers, not a demo.

This README is the canonical minimal reference. The formal argument grows from
it: [`WHITEPAPER.md`](WHITEPAPER.md) is the paper's skeleton, with the full paper
and public specification forthcoming.

---

*SST — Peter Russell. sst-kernel, 2026. Code Apache-2.0, prose CC BY 4.0.*
