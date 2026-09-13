This is the kernel's own account of how it reads a page. It was the greater
part of the README until 2026-09-09, and moved here unchanged: the README
orients, the whitepaper explains, this specifies.

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
7. **Projections, not the object.** The first-class object is the operator's
   *crystal* — the atoms, the lattice and the charter, held privately — and
   everything published is a **projection** of it. This repository projects an
   example crystal it also shows you (`substrate/`, `charter.yaml`), so the
   mechanism is visible end to end; the live reference artefact projects a real
   crystal that stays private, and its verification face and its brochure's data
   face are further projections of that same one. Between two projections, and
   between a projection and the roots the origin publishes, a reader can
   establish that they agree — which is the second rung of the ladder under
   **Trust model**, and no higher. What a face *withholds* is a different
   question: matching a published face against the material behind it needs the
   operator to share a slice of the crystal, and until then a reader has the
   domain, the artefacts on it, and the roots.

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
| **composition** | WHERE, HOW MANY TIMES, AND HOW — the page's placements, in order, the page's own furniture, and the registry its descriptors name | a placement-coordinate: the identity placed, the coordinate it was placed at, and a root over the atoms it carried with the mode each was carried in; then two trailing leaves, one over the page's furniture root and one over its `registry_hash` | a block is moved, repeated or dropped, a placement changes what it prints or how, a word of the page's own furniture changes, or the registry the page names is swapped — **never** on a content edit |
| **geometry** | THE SHAPE, incl. negative space | a site-coordinate valued by occupancy state | a site is added/removed, or a hole is filled/sealed — **never** on a content edit |

**What a page root names.** The page root is the Merkle root of the page's block sequence
in canonical order, and nothing else: it is the identity of the collection the page carries,
not of the page. Two pages that carry the same collection share it — the reference artefact
has one such pair, two project pages that each show the other in a related-work strip, so
their attested block sequences coincide. That is the content spine doing what it says. The
identity of the page *as arranged* is the composition root, which differs between them, and
a face or an index that names a page should name it by its composition root, or by both.

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
| 6 | **completeness** — every atom a placement declares is found on the surface it declares, in the order it declares, and once every declared element is accounted for — an attribute-mode element accounting for its attribute and never for what it shows — the wrapper holds *no visible text besides*; and, on a v1.3 page, the same question of the whole page — the furniture it carries is the furniture the manifest declares, the declared furniture root is the root over what the page shows, and nothing visible is left over |
| — | **the §6.2 DOM-text rule** — gate 5's DOM-side counterpart: every *visible* atom's text re-hashes to its id (or, for a projected atom, the named projection recomputes) |
| 7 | **composition** — the page renders exactly the declared placements, in document order; the declared furniture root recomputes from the declared furniture list; and the composition root recomputes from the placement leaves plus two trailing leaves, one over the page's furniture root and one over the registry its descriptors name |
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
most good checks. On a v1.3 page it asks the same question of the whole body, not
only of each wrapper — see **the furniture**, below, which is what made "the page
contains nothing else" a true sentence rather than a nearly true one.

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
what remains of the wrapper, once every chrome-marked element is cut out, must
hold no visible text at all. What a *placement* removes from that residue is the
**mode's** to decide, and it is not the same span in all three. A `verbatim` or
`non-text` atom accounts for its element whole: what the element shows is the
atom's text, or the mode requires it to show none. An `attribute` atom accounts
for its attribute and for **nothing a reader sees** — its element's own children
stay in the residue and are read like any other text on the page, so a sentence
parked inside a rating's wrapper is refused, and refused by name.

Four consequences worth stating plainly.

- **Omitting the list means what it always meant.** No `atoms` list is "all of
  this block's atoms, canonical order, verbatim" — so every page written before
  the field existed says exactly what it said, and the v1.1 fixture in
  `vectors/` passes gate 6 without a byte changing.
- **Complete or partial is derived, never declared.** A placement whose list is a
  proper subset of its block's atoms is a **partial** placement: it printed some
  of them, and the block still holds all of them. Nothing announces this, so
  there is no field to forge — the two lists say it.
- **Chrome.** Where the page's furniture must sit *inside* a wrapper,
  `data-sst-chrome` on the element excludes its span from that wrapper's residue
  and buys nothing else: an element carrying both a chrome marker and an atom
  stamp is refused, since admitting the pair would make the marker a way to hide
  an atom from its own check. The marker does not make the text disappear — it
  moves it into the furniture list, below, where it is declared and hashed.
- **Whitespace is not evidence.** Every text comparison in gate 6 is made with
  all whitespace removed on both sides. A page that sets two atoms with no space
  between them, or lays a label across three lines of source, differs from its
  atoms by typesetting; a page that changes one letter still fails.

**A block wrapper carries content and nothing else.** The page-level rule below
reads `<script>`, `<style>` and `<template>` as showing nothing, because a
minified stylesheet in the body is not a sentence the page shows and a page-wide
rule that counted one would report every ordinary artefact as carrying unattested
text. **The per-wrapper rule is deliberately not relaxed the same way**: an inline
script or style *inside* a block wrapper is residue, and gate 6 refuses the page.

That is a conformance rule, not a limitation of the check. A wrapper is the span
in which "this block reconstructs from its atoms and nothing else" is asserted;
whatever sits inside it is being asserted about. Scripts and styles belong outside
wrappers — in the head, or in the body between them, where the furniture rule
already reads them as showing nothing — and an emitter has no reason to put one
inside a block it is making a completeness claim about. Relaxing the wrapper to
admit them would widen the one span the format asks an emitter to keep clean, and
that is a format change to be argued for rather than a convenience.
`refusals/script-inside-wrapper.html` freezes it.

**The furniture — the page's own text, declared.** A page is not only its
blocks. It carries a plate number, a footer line, a breadcrumb: text that is the
page's rather than the operator's content, that no atom attests, and that until
v1.3 entered no root at all. Two holes followed, and both were live on this
kernel's own page:

- a `data-sst-chrome` element had its span cut from its wrapper's residue and
  **nothing bounded its text**, so an added chrome-marked paragraph of prose
  passed all nine gates and matched the origin's roots;
- text between two block wrappers lay outside every wrapper's own markup, so a
  **visible paragraph nobody wrote** was invisible to every gate — while this
  document said the page contains nothing else.

So the furniture is *declared*, exactly as a render mode is, and for the same
reason: a verifier that inferred which text was furniture would accept any text
as furniture. **The page's FURNITURE is**, in document order:

- every `data-sst-chrome` element's normalized visible text, inside or outside a
  wrapper;
- every run of visible text in the body that lies outside every block wrapper and
  outside every chrome-marked element.

A span showing no text declares nothing and enters no list — a spacer, a rule, an
icon — because hashing an empty string once per decorative element would put
typography inside a published root. `<script>`, `<style>` and `<template>` are
not visible text and are read as none — **here**, at the page level. Inside a
block wrapper they are still residue and gate 6 still refuses them, for the
reason given above: a wrapper carries content and nothing else.

The manifest publishes that list as `furniture` and its Merkle root over
`sha256(text)` per span as `furniture_root`; an empty list has the defined root
`merkleRoot([])`, which is SHA-256 of the empty string,
`e3b0c442…`. **The binding:** the composition root is the root over the placement
leaves **plus two trailing leaves**, `sha256('furniture' ␟ furniture_root)` and
then `sha256('registry' ␟ registry_hash)`, each appended unconditionally so a page
cannot drop a claim by declining to make it. The placement leaves themselves are
byte-identical to what they were, which is why this was the cheapest binding
available.

Gate 6 checks the list against the page in both directions and checks the
declared root against what the page shows; gate 7 recomputes the root from the
declared list and folds it into the composition root. An injected sentence
therefore has to move a published value. A page that rewrites its own furniture
list *consistently* still passes every gate — and is caught the moment its roots
are compared with the origin's. That is the claim ladder's second rung and no
higher, and `refusals/consistent-furniture-rewrite.html` freezes it: a page that
passes all nine with a composition root that is not the frozen page's.

**Which registry, named.** A render descriptor names a transform symbolically, so
a verifier that cannot tell *which* registry a page's descriptors refer to
recomputes a label with whatever table it happens to carry and calls the result an
agreement. A v1.3 manifest therefore carries `registry_hash` — the SHA-256 of the
registry's own source region, the same value the conformance vectors freeze. Gate
6 compares it with the table the verifier actually holds.

**And the name is bound, not merely declared.** That comparison catches a page
whose registry the verifier does not share; on its own it cannot catch a page
whose registry name was changed *after* the origin published it, because nothing
tied the name to anything the origin signed — the verifier could only say "your
table and mine differ", never "this is not the page that was published". So
`registry_hash` is also the composition root's second trailing leaf, built exactly
as the furniture leaf is. A registry swap now moves a published root, and is
tamper-evident against the origin's roots rather than only against whatever table
the verifier happens to carry. Both checks fire on an edited `registry_hash`, and
neither is redundant: gate 6 is silent where the *verifier* is the one that is out
of date, and gate 7 is silent where verifier and page agree on a table the origin
never used. `refusals/registry-hash-edited.html` freezes both.

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
and the page carries no visible text besides its atoms and its declared furniture
— and then three things that used to be declared and unchecked: the *sequence and multiplicity* of the page's
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

## Trust model

The gates are one layer of a stack, and saying which layer keeps the rest of this
document honest.

**Level 1 — internal integrity.** The nine gates and the DOM-text rule, run
against the published HTML alone. They establish that the artefact is consistent
with itself: the visible text re-hashes, the roots recompute, the placements and
the geometry and the charter agree with the page and with each other, and the page
shows nothing besides its atoms and its declared furniture. The composition root
is where three kinds of leaf meet — the page's placements, the page's own
furniture, and the registry its render descriptors name — so all three are one
recomputation rather than three separate promises. This is what
`node sst-kernel.mjs verify` proves and the whole of what it proves.

**Level 2 — source correspondence.** The page's roots compared with the roots the
declared origin publishes. Internal integrity cannot distinguish an artefact from
a consistent rewrite of it: relabel a coordinate everywhere, inject a sentence and
declare it as furniture, or point the descriptors at another registry and swap the
verifier's table to match, and every root recomputes. What refuses those is that
the recomputed root is not the published one — which is the reason the registry's
name is a leaf and not only a declaration checked against the verifier's own
table. The reference artefact already does
this in public: its machine itinerary walks a reader from the kernel to a live
page to the verification face, to `curator_root`, to the crystal state, so the
roots on the page can be checked against the roots the origin stands behind.

Above and outside this kernel, three further layers, none of them shipped and none
of them claimed here:

- **Origin authentication** — binding an artefact to an operator rather than to a
  domain: signatures, DNS, transparency logs. The signature extension is designed
  and parked; until it ships, verification is relative to the canonical origin,
  authenticated by DNS and TLS.
- **Historical provenance** — what the artefact said *before*. Roots are a
  fingerprint of now; snapshots are what make "this paragraph was here last year"
  checkable.
- **Projection attestation** — which crystal material a published face withholds.
  A page's geometry slice says what that page publishes; nothing yet attests the
  relationship between a face and the material behind it, so a reader cannot tell
  a narrow face from a complete one. This is research, and it is the question the
  author most wants attacked.

## Known limitations and open research questions

Stated as a list because a limitation buried in a paragraph is a limitation
hidden.

- **Authenticated origin.** Nothing binds an artefact to a person or a company.
  A faithful copy is exactly as consistent as the original. See level 2 above.
- **Parser equivalence.** This verifier is a structural scanner over HTML source,
  not an implementation of the HTML parsing algorithm. Malformed markup, exotic
  nesting, or a document a browser recovers from differently could be read by the
  scanner as one shape and by a browser as another. A future conformance rule may
  restrict the verifiable face to well-formed markup, which is the honest fix; a
  scanner that grew special cases until it was a parser would be the dishonest
  one.
- **Element type and attribute semantics.** The render descriptor names a surface
  and a transform. It does not name the element type, and no gate reads it: an
  atom printed in an `<h1>` and the same atom printed in a `<span>` are the same
  placement to every root here. What is unchecked is now exactly one thing: the
  **values of attributes no placement declares**. `href`, `lang`, `hidden`,
  `title` and the rest are outside the attested face, and no root moves when one
  changes. An attribute value is markup a verifier reads rather than a sentence
  the document sets, so it is not prose smuggled past the residue rule; the edge
  worth knowing is that a browser may surface one of its own accord (a `title`
  tooltip), and that surfacing is outside every gate here. What this bullet no
  longer covers is the bearing element's own child text: gate 6 reads what an
  attribute-mode element SHOWS, and refuses it.
- **CSS visibility and runtime mutation.** The gates read source. A block whose
  markup is intact but which CSS hides, whose text is substituted via
  `::before`/`::after`, or which JavaScript rewrites after load, passes. The
  attested publication face is the served markup, and it will not become the
  rendered pixel.
- **The transform registry is pinned by hash, and named symbolically.** A
  descriptor says `rating-label`; what that means lives in the registry. v1.3's
  `registry_hash` closes the naming half — a verifier can now tell whether the
  page's registry is its own, and, since the hash is a leaf of the composition
  root, whether it is the one the origin published — but the descriptors still
  refer to entries by name,
  and a registry that added an entry without moving the hash would be a different
  table wearing the same badge. The hash is what makes that impossible; the
  symbolic reference is what makes the hash necessary.
- **Projection attestation.** Nothing attests what a face withholds. See level 2
  above.
- **`order` is declared and never verified**, at every version, for the reason
  given above: it is a section-local label and nothing the page shows can
  contradict it.

This repository is a demonstrator of a proposed architecture. It asks first to be
considered — what publishing this way would mean, for whom, at what cost, and with
what implications — and then to be attacked, extended and falsified; it is not a
claim of completeness.

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
  frozen page itself and something neither other set has: a **refusal set**.
  Thirty files under `refusals/`, each the frozen page with one edit, each
  naming the exact list of checks `verify` must report. Twenty-nine are refusals.
  Most of them passed all six of the previous version's gates untouched, which is
  why they exist; the control is an edit the previous version already caught and
  must still catch in the same place; two of them are the cases the newest
  bindings brought with them — a swapped registry name, and an inline script
  inside a block wrapper; and two are nearer still, a sentence hidden in an
  attribute-mode element's own children, which passed all nine gates until gate 6
  stopped cutting that element's whole span. The thirtieth must **pass**: the same
  injected paragraph as the refusal beside it, *declared*, with both roots
  recomputed — a page with internal integrity and a composition root that is not
  the origin's, which is the claim ladder's second rung frozen as a vector. Beside
  them sits a second frozen page serving the same terms in the other charter
  shape, which must pass all nine — a refusal alone cannot tell you a shape was
  *read* rather than skipped. A gate nobody has watched refuse is a comment.

A further set, `vectors/genesis-face/`, freezes the machine records a genesis face
emits (`kit/AGENT-GENESIS.md` §7) rather than the format itself; the kernel does
not run it, and it carries its own checker.

[`vectors/README.md`](vectors/README.md) has the full provenance of all four. If you
port this kernel and your bytes differ from those, one of us is wrong and the
difference is exactly locatable — which is the entire argument for having
vectors at all.

## A note on versions

v1.3 proceeds on the reading that a format version names the manifest schema and
the gate set together, while identities stay stable across versions — so an
artefact at an older version is not stale, it is older, and it is checked by what
it promised. That reading is proposed rather than settled; the alternative is a
separate version number for the gate set. If it changes, what changes is the
dispatch, not a single hash.

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
