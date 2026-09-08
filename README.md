# sst-kernel

**SST — Single Source of Truth: a self-verifying content format for sovereign operators: the operator holds the substrate, the public face is read-only by construction, and the charter travels as data.**
This repository is its kernel: the whole idea in one dependency-free file you
can read top to bottom in a sitting — about fourteen hundred lines, more than a
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
| **composition** | WHERE, HOW MANY TIMES, AND HOW — the page's placements, in order | a placement-coordinate: the identity placed, the coordinate it was placed at, and a root over the atoms it carried with the mode each was carried in | a block is moved, repeated or dropped, or a placement changes what it prints or how — **never** on a content edit |
| **geometry** | THE SHAPE, incl. negative space | a site-coordinate valued by occupancy state | a site is added/removed, or a hole is filled/sealed — **never** on a content edit |

The geometry spine is *matter-invariant*: editing an atom leaves the coordinate
and its state untouched. So is the composition spine — moving a block changes
neither the block nor the page root, and editing the block changes neither
placement. That orthogonality is what `seal` demonstrates for the first pair, and
it is why three roots are three roots rather than one.

The page publishes its own geometry slice, and the slice is defined by what the
page PLACES and what it PUBLISHES: for every coordinate it prints, the roles it
publishes there and the vacancies that coordinate declares, with the root that
recomputes from them. It is deliberately not a *lattice page's* slice, because a rendered page is
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
| 6 | **block completeness** — every atom a placement declares is found on the surface it declares, in the order it declares, and once every declared element is accounted for the wrapper holds *no visible text besides* |
| — | **the §6.2 DOM-text rule** — gate 5's DOM-side counterpart: every *visible* atom's text re-hashes to its id (or, for a projected atom, the named projection recomputes) |
| 7 | **composition** — the page renders exactly the declared placements, in document order, and the composition root recomputes from them |
| 8 | **geometry** — the page's geometry root recomputes from the sites it publishes; at every coordinate it places, the roles the block published there and the present sites declared there are the same set, *both ways*; and no site names a coordinate the page does not place |
| 9 | **the charter** — the page serves *exactly one* charter object, and its served terms hash to the atom that charter names, inside a block the manifest carries, and therefore under the page root |

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

**Placement render mode — how gate 6 reads a page that is not all prose.** An
artefact of any size renders most of its atoms somewhere other than as a
paragraph: an image's alternative text sits in an `alt` attribute, a rating of
`5` is announced as "5 out of 5 stars", three taxonomy atoms are set as one
label, and the bytes of a photograph are attested but never written down. A gate
that assumed every atom is visible text would report all of that as tampering,
and a verifier that guessed from the markup which was which would accept any
markup. So the mode is **declared**, per atom, per placement:

```jsonc
{ "block": "<hash>", "section": "plate", "name": "figure",
  "atoms": [ { "hash": "<matter>",  "render": "non-text" },
             { "hash": "<alt text>", "render": "attribute:alt" },
             { "hash": "<caption>",  "render": "verbatim" } ] }
```

A descriptor is a **surface** and an optional **transform**: `verbatim` (the
default), `attribute:<name>`, or `non-text`, any of them optionally through a
named entry of the shared transform registry — `attribute:aria-label:rating-label`
carries the atom `5` into the label a screen reader reads. Gate 6 walks the list:
every atom must be found on the surface it declares, on an element carrying its
`data-atom-hash`, in the order declared; then the residue rule takes over, and
what remains of the wrapper once every declared element and every chrome-marked
element is cut out must hold no visible text at all.

Four consequences worth stating plainly.

- **Omitting the list means what it always meant.** No `atoms` list is "all of
  this block's atoms, canonical order, verbatim" — so every page written before
  the field existed says exactly what it said, and the v1.1 fixture in
  `vectors/` passes gate 6 without a byte changing.
- **Complete or partial is derived, never declared.** A placement whose list is a
  proper subset of its block's atoms is a **partial** placement: it printed some
  of them, and the block still holds all of them. Nothing announces this, so
  there is no field to forge — the two lists say it.
- **Chrome.** Markup outside every block wrapper is invisible to gate 6 already;
  a wrapper's own markup runs from where it opens to where it closes. Where the
  page's furniture must sit *inside* a wrapper, `data-sst-chrome` on the element
  excludes its span from the residue and buys nothing else: an element carrying
  both a chrome marker and an atom stamp is refused, since admitting the pair
  would make the marker a way to hide an atom from its own check.
- **Whitespace is not evidence.** Every text comparison in gate 6 is made with
  all whitespace removed on both sides. A page that sets two atoms with no space
  between them, or lays a label across three lines of source, differs from its
  atoms by typesetting; a page that changes one letter still fails.

**Where the mode is attested, and where it is not.** Not in the atom id, not in
the block root, not in the page root, and not in the geometry leaf. Renaming an
attribute would fork an atom's claim if it were inside the atom; one block
rendered verbatim on one page and as an attribute on another would be *two
blocks* if it were inside the block root. What a page did with an identity is the
placement's fact, so the placement leaf carries it as a fourth field — a Merkle
root over `sha256(atom-hash ␟ descriptor)` in rendered order. A forged, swapped
or deleted mode therefore moves the composition root and gate 7 refuses the page,
while every atom, block and page root stays byte-identical.

**The transform registry is shared, not local.** A transform that meant one thing
in the emitter and another in the verifier would forge every label it touched, so
there is one closed table, vendored byte-for-byte wherever it is needed. This
kernel stays one file, so the table is not a module: it sits between two markers
in `sst-kernel.mjs`, and the conformance vectors pin both its input→output pairs
*and* the SHA-256 of the region's own bytes. An implementation proves its copy
equal by reproducing that hash — and an entry present in one table and absent
from the other is drift in either direction.

**What none of this reaches, stated once.** `non-text` proves that the page
claims this matter at this site and nothing more: matter is never served, so no
reader re-hashes an image back to its hash. An attribute is markup a verifier
reads, not text a reader is shown — an `alt` on an image nobody is shown still
passes. And a composed label is trustworthy only because its free parameters
*are* the atoms the placement names.

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
a block the page root covers. Every one of those coordinates is attested by the
page's own roots, not by a record outside it, so relabelling which coordinate a
block occupies — consistently, across `manifest.blocks`, `placements` and
`geometry.sites` — recomputes every root and passes every gate; the same limit
as any self-consistency check here, it is caught only against the origin's own
roots.

What remains outside, and it is worth naming precisely:

- **The artefact still declares its own shape.** Gate 8 checks that the declared
  sites are internally consistent, hashed, and agree with the blocks the page
  carries. It cannot discover a site the artefact never declared, because a site
  the artefact never declared leaves no trace on the page. It also cannot see a
  site the operator *withholds*: a block may be **projected**, publishing fewer
  roles than the substrate places at its coordinate — a telephone number that
  stays in the lattice and never reaches a machine face. The page's slice is the
  page's own shape and says only what the page publishes; the committed sidecar
  carries the whole artefact's shape, where the withheld site is still present.
  A slice showing fewer present sites than the sidecar is **projection, not
  loss**, and gate 8 reads the page's.
- **A declared render mode is checked, but the surfaces are not equal.** Gate 6
  proves that every atom a placement declares is present in the form it declares
  and that nothing else visible is in the wrapper. It does not make an attribute
  into something a reader sees: an `alt` that re-hashes correctly on an image
  nobody is shown passes, and that is the same markup-fidelity boundary this
  format has always had. `non-text` is weaker still — it attests that the page
  *claims* this matter here, and matter is not served, so nothing re-hashes the
  bytes. What the modes buy is that these surfaces are now inside the composition
  root instead of outside every root: a swapped or forged one is refused, where
  before it was invisible.
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
  check that must catch it. Twelve of the thirteen passed all six of the previous
  version's gates untouched; the last is a control the previous version already
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
