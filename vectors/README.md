# vectors/ — the frozen conformance vectors

Prose drifts. It drifted inside this project's own repository: at one point two
implementations computed different atom ids for smart-quoted text, used
different empty-Merkle conventions, and shipped charters with different numbers
of permission categories — while the prose describing them agreed perfectly.
Byte-exact vectors that any implementation must reproduce are the only binding
that does not rot.

`node sst-kernel.mjs vectors` runs the three sets below. They have different
provenances and prove different things. **Which is which matters, so it is
stated here rather than implied.**

The third set adds a kind of vector the first two do not have: a **refusal
set**, which pins what the gates must REJECT rather than what the primitives must
reproduce. A vector that only ever passes cannot tell you a gate has quietly
stopped checking.

---

## `v1-fixture/` — identity, frozen by the production implementation

**Provenance: computed by a DIFFERENT implementation.** Every value in
`expected.json` was produced by the full production SST implementation (a
TypeScript codebase, a different language and a different author of the code
path) over the substrate in this directory. The kernel re-derives all of them
through its **own** primitives and must match byte for byte.

This is the cross-implementation check, and it is the reason "SST in miniature"
is a measurement rather than a slogan. Two independent implementations agreeing
on every hash is evidence; one implementation agreeing with itself is not.

What it pins:

- **21 atom ids** — reproduced from their normalized forms, sentinels included
  (an atom id is just a hash).
- **19 atom contents re-hashed raw** + **12 block roots** + the **page root** —
  through the whole normalization rule: whitespace runs, tabs and embedded
  newlines; smart quotes; NFC composed vs decomposed (`café` written two ways,
  one identity); the `*em*` / `**strong**` inline marks; an escaped `\*`; an
  atom whose content is `&`, `<`, `>` and quotes, surviving the entity
  round-trip. The single-atom block proves the domain-separated Merkle
  construction (a one-leaf root is NOT its leaf).
- **The §6.2 DOM-text rule** over `home.html`, projected `enum-label` atom
  included.
- **Gate 6, block completeness** over the same page. `home.html` was rendered
  before gate 6 existed; if the new gate is a faithful reading of what a
  conformant emitter already does, it must pass here without a byte changing.
  It does.
- **The geometry root and census** — 18 sites, 13 blocks, all four occupancy
  states (`present` / `pending` / `na-omitted` / `na-impossible`), rebuilt from
  the raw lattice with sentinels included.

**These values are marked format v1.1, and that is correct, not stale.** v1.2 and
v1.3 each moved the manifest SHAPE and the GATE SET and each deliberately left
identity alone: normalization and the Merkle construction are untouched, so every
v1.1 identity survives both version bumps unchanged. That these values still
reproduce under a v1.3 kernel is itself the claim being tested. The manifest inside
`expected.json` and `home.html` says `"version": "1.1"` because the
implementation that emitted it emits v1.1 — editing that string by hand would
be forging an agreement that has not happened yet.

`atoms.csv` carries a `notes` column naming each row's edge case; read it
alongside the file. `charter.yaml` is the fixture's own sovereignty stencil,
minimal by design: exactly the six universal permission categories.

The fixture's TypeScript generators are not carried here. They import the
production implementation, which is not public; the data they froze is what
matters and is what a second implementation needs.

---

## `v1.2-manifest/` — the manifest shape, frozen by this kernel

**Provenance: computed by THIS kernel. It is a freeze, not an agreement.** No
production implementation emits v1.2 yet — the reference implementation still
emits v1.1 semantics and says so — so there is no second implementation to
agree with. Saying otherwise would be the exact overclaim this project exists
to catch.

What a freeze is worth: it makes drift a build failure rather than a surprise.
The comparison is byte-exact JSON — field order, omitted provenance labels and
all — so a dedupe that stops deduping, a label that starts guessing, or a
version string that slips back to 1.1 each move these bytes and each fail
loudly.

**Built over the substrate frozen beside it**, `atoms.csv` and `lattice.csv` in
this directory — not over the live `substrate/`. That is a change of inputs, not
of values: every byte of `expected.json` is what it always was. The reason is that
the live fixture grows whenever a new rule needs exercising, and a v1.2 set built
from a moving substrate would have to be re-cut each time — which would quietly
turn "the older shape is still emitted byte-for-byte" from a promise anyone can
check into a sentence nobody can. Pinned, the promise is testable for good. The
copy here is the substrate these bytes were frozen over.

What it pins:

- the **page manifest** — 7 block identities, 14 atoms, `version: "1.2"`,
  and the three superposition twins' labels: one entry keeping `page` + `name`,
  one keeping `name` alone, one keeping `section` + `name` + `order` with no
  `page`. `substrate/README.md` says what each twin exists to catch.
- the **geometry spine** — 15 sites, 10 blocks, across both the published page
  and the draft one. One of those sites is *withheld* from the published page,
  and the sidecar is where it is still counted.

**It becomes a cross-implementation check the day a second implementation
reproduces it.** That is the invitation: port the kernel, point it at this
directory, and if your bytes differ from these, one of us is wrong and the
difference is exactly locatable.

This set also holds the kernel to a promise the version axis has to keep: the
v1.2 shape is still emitted on demand, so an artefact built to it keeps verifying
exactly as it did. If this set ever needs the kernel changed to keep reproducing,
the version axis is broken, not the vector.

---

## `v1.3-manifest/` — composition, geometry-in-page and the charter, frozen by this kernel

**Provenance: computed by THIS kernel. A freeze, not an agreement**, on the same
terms as `v1.2-manifest/`, over the same substrate.

**The composition root has moved three times, and the version has not.** Every
time because v1.3 is still pre-release, and all three are recorded here rather
than left in a commit message.

1. The placement leaf was `sha256(block ␟ section ␟ name)` when this set was first
   frozen; it became `sha256(block ␟ section ␟ name ␟ R)`, where `R` is a Merkle
   root over `sha256(atom-hash ␟ render descriptor)` in the order the placement
   printed them. Folding the render declaration into the leaf is what makes a
   forged or swapped mode move a root instead of moving nothing.
2. The composition root gained a **trailing leaf**,
   `sha256('furniture' ␟ furniture_root)` — the page's own text, the text no atom
   attests. Before it, a chrome-marked paragraph and a paragraph between two
   wrappers each entered no root at all, and a page carrying either passed all
   nine gates and matched the origin's roots. The leaf is appended
   unconditionally, so a page cannot drop the claim by having no furniture; the
   placement leaves are byte-identical across the change, which is why this was
   the cheapest binding available.
3. It gained a **second trailing leaf**, `sha256('registry' ␟ registry_hash)`,
   built exactly as the furniture leaf is and appended after it. `registry_hash`
   already sat in the manifest, checked by gate 6 against the table the verifier
   itself carries; that catches a page whose registry the verifier does not share,
   and cannot catch a page whose registry name was changed after the origin
   published it, because nothing tied the name to anything the origin signed.
   Bound, a registry swap is tamper-evident against the origin's roots rather than
   only against the verifier's own table. The placement leaves and the furniture
   leaf are byte-identical across the change; the leaf order is fixed as
   placements, then furniture, then registry.

No implementation has shipped v1.3 publicly — the reference artefact emits v1.3
fields but has not been released under that name — so all three are changes to a
draft, not breaks of a promise. Every atom, block and page root is byte-identical
across them; only `composition_root` and, the second time, the new `furniture`,
`furniture_root` and `registry_hash` fields moved these bytes — the third time,
`composition_root` alone. The moment v1.3 ships, that leaf list is as frozen as
any other value here.

The kernel's own fixture also grew — four blocks and eleven atoms — so that every
render mode is exercised by something the kernel actually builds rather than
described in prose: a matter-hash atom stamped on a `<picture>` and showing
nothing, an `alt` carried on the `<img>` nested inside it, a rating whose atom is
`5` and whose rendered form is the label a screen reader announces, three
taxonomy atoms composed into one label by a registry transform, a placement that
prints two of its block's three atoms and prints them backwards, and a
chrome-marked element inside a wrapper. It has since gained a **footer line
outside every wrapper**, so the fixture exercises both halves of the furniture
rule — chrome inside a wrapper, free text outside them all — with something the
kernel actually builds rather than described in prose. `v1-fixture/` and
`v1.2-manifest/` are untouched by that growth, which is what the pinned v1.2
substrate above is for; the footer is emitted only at v1.3, because furniture is
a v1.3 declaration and a page that cannot declare its own furniture should not be
made to carry any.

What it pins, in `expected.json`:

- the **page manifest** — 12 block identities (the 7 the v1.2 set pins, the 4 new
  mode-bearing blocks, and the synthesized charter attestation block), 11
  placements, 20 geometry sites, `version: "1.3"`, and four roots rather than
  one: the page root, the **composition root** over the placement transcript and
  the two trailing leaves, this page's **furniture root**, and this page's own
  **geometry root** over the sites its placements define. The whole-artefact
  geometry sidecar is unchanged by v1.3 and stays frozen in `v1.2-manifest/`.
- the **furniture** — the two spans this page carries that no atom attests: the
  plate number, marked `data-sst-chrome` inside a wrapper, and the footer line
  outside them all. Both are in the list, in document order, and the root over
  them is the composition root's first trailing leaf. Add a word to either and
  these bytes move, which is the whole point of the leaf.
- the **registry the descriptors refer to** — `registry_hash`, the SHA-256 of the
  registry's own source region, published in the manifest as well as frozen below,
  and the composition root's second trailing leaf. A descriptor names a transform
  symbolically; without this a foreign verifier recomputes a label with whatever
  table it happens to carry, and without the leaf the name rests on a declaration
  nobody at the origin ever signed.
- the **placement render modes** — four of the eleven placements carry an
  `atoms` list; the other seven omit it, which is the default and means "all of
  this block's atoms, canonical order, verbatim". Both paths are frozen here on
  purpose: the omitted list is what every page written before the field existed
  says, and a change that made it mean anything else would move these bytes.
- the **shared transform registry** — the input→output pairs for every entry, and
  the SHA-256 of the registry's own source region in `sst-kernel.mjs` (between the
  two `SHARED TRANSFORM REGISTRY` markers, the marker lines themselves excluded).
  The pairs answer "does this implementation compute what the registry says"; the
  hash answers "is this the same registry at all", which the pairs cannot — a
  table with one extra entry, or one differently worded that happens to agree on
  the frozen cases, reproduces every pair and is still a different table. An
  implementation vendoring the region proves its copy equal by reproducing the
  hash. An entry in one and not the other is drift in either direction.
- the **charter** — including the attestation that names the atom and the block
  under which its terms are hashed. Flip a permission and this file moves.

The 20 sites are the sites of the 19 coordinates the page PLACES — the roles
it PUBLISHES there, plus the one vacancy those same blocks declare. Three kinds of
site are therefore absent from them, and each absence is deliberate. The two
head-rendered sites (`meta/seo`) are absent because the page places no such block,
so the slice makes no claim about it. The draft page's sites are absent for the
same reason. And the colophon block's `phone` site is absent because the page
**withholds** it: the substrate places an atom there and the published faces do
not carry it, so the block the page publishes is a projection of the substrate's,
and the slice lists what was published. The whole-artefact sidecar in
`v1.2-manifest/` is where all three are still counted — a page's slice showing
fewer present sites than the sidecar is projection, not loss.

Both narrowings are load-bearing. A slice keyed on the lattice page rather than on
the placements publishes sites the page cannot show, which on any composed page
turns gate 8 into a refusal of ordinary composition; a slice valued by the
substrate's occupancy rather than by what the page published does the same to
every page that withholds anything, which on the reference artefact is every page
it serves. Reinstate either reading and this freeze moves, which is the point of
freezing it.

And, beside them, `page.html` — the exact bytes the kernel builds. That is not
decoration: twenty-nine of the thirty files in `refusals/` are that page
with one edit, so a page that drifted would turn the refusal set into a test of nothing.
`vectors` rebuilds it byte-for-byte, and checks it passes all nine gates, before
it trusts a single refusal.

`page-sst-charter-field.html` is the thirtieth file's subject and a vector in
its own right: the same terms served in the OTHER charter shape — an entity document
carrying an `sst_charter` field, which is what the reference implementation serves
— with its attestation block re-derived by the same canonical rule. The kernel
does not emit that shape, so this page is cut by hand rather than rebuilt; what it
pins is that ONE rule reads BOTH shapes, and `vectors` checks it passes all nine.
A refusal on its own could not prove that: a charter that is never found fails
gate 9 too.

### `refusals/` — what the gates must REFUSE

The other two sets pin what the primitives must reproduce. This one pins what the
verifier must reject, which is the half a passing vector cannot reach: a gate can
be deleted, weakened, or accidentally short-circuited without a single frozen
hash moving.

Thirty files, each a frozen page with ONE edit, each declaring in
`expected.json` the exact list of checks `verify` must report — so a gate that
stops refusing, starts refusing something else, or starts refusing two things at
once all show up as drift rather than as a quiet pass.

Twenty-nine of them are refusals. The thirtieth,
`consistent-furniture-rewrite.html`, must **pass**, and it is in this set because
what it pins is the set's own boundary — see the note below the table.

| file | edit | must fail |
|---|---|---|
| `reordered-blocks.html` | the first two rendered blocks swapped | gate 7 |
| `duplicated-block.html` | one block rendered a second time | gate 7 |
| `dropped-superposed-placement.html` | one of the two placements of a superposed identity deleted | gate 7 |
| `edited-atom-role.html` | an atom's `role` changed in the block list, its geometry site left alone | gate 8 |
| `added-geometry-site.html` | a present site added for a role the block placed there does not carry, with the declared root recomputed over the longer list | gate 8 |
| `removed-geometry-site.html` | the page's one declared vacancy deleted from the site list, the declared root left as it was | gate 8 |
| `dropped-published-role.html` | a present site deleted for a role the block placed there does publish, with the declared root recomputed over the shorter list | gate 8 |
| `withheld-site-claimed-present.html` | the projected block's withheld site claimed present in the slice — the sidecar's value for that coordinate — with the declared root recomputed | gate 8 |
| `flipped-charter-permission.html` | one permission flipped in the served charter, the attested copy left alone | gate 9 |
| `deleted-charter.html` | the charter declaration deleted outright | gate 9 |
| `second-charter.html` | a second charter object appended after the first, granting everything the first withholds | gate 9 |
| `sst-charter-field-flipped.html` | one permission flipped in a charter served in the other shape (on `page-sst-charter-field.html`) | gate 9 |
| `edited-visible-text.html` | the control — one letter of visible text | gate 6 + the DOM-text rule |
| `injected-visible-text.html` | a sentence injected inside a wrapper, carrying no hash | gate 6 |
| `script-inside-wrapper.html` | an inline `<script>` added inside a wrapper — inert at the page level, residue inside a wrapper | gate 6 |
| `missing-non-text-stamp.html` | the stamp removed from the element bearing a non-text atom | gate 6 |
| `attribute-value-changed.html` | one letter changed inside the attribute an atom is carried in | gate 6 |
| `attribute-mode-child-text.html` | a sentence added as a child text node of an attribute-mode element — stamp, attribute, manifest and roots all untouched | gate 6 |
| `attribute-mode-svg-text.html` | the same sentence drawn instead as an `<svg><text>` child of that element | gate 6 |
| `transform-label-changed.html` | a composed label edited away from what the registry transform makes of its atoms | gate 6 |
| `partial-placement-overclaims.html` | a partial placement claiming an atom the wrapper does not show, root recomputed | gate 6 |
| `reordered-atoms.html` | two atoms swapped *inside* one wrapper, each still re-hashing | gate 6 |
| `chrome-marked-atom.html` | an element marked as chrome while carrying an atom stamp | gate 6 |
| `placement-claims-foreign-atom.html` | a placement naming an atom its block does not hold, root recomputed | gate 6 |
| `render-descriptor-tampered.html` | a render descriptor edited with the composition root left alone | gate 7 |
| `undeclared-chrome-furniture.html` | a chrome-marked paragraph of prose added inside a wrapper, roots left alone | gate 6 |
| `undeclared-free-text.html` | a visible paragraph added between two wrappers, roots left alone | gate 6 |
| `edited-furniture-text.html` | a declared furniture span edited in both faces, both roots left alone | gate 6 + gate 7 |
| `registry-hash-edited.html` | the registry the descriptors name edited in its last character, the composition root left alone | gate 6 + gate 7 |
| `consistent-furniture-rewrite.html` | the chrome paragraph again, DECLARED — furniture list extended, both roots recomputed | *nothing — it must pass, with a composition root that is not the frozen page's* |

The four geometry cases are matched pairs on purpose. Removing a site with the
root left alone is caught by the root; adding one with the root *recomputed* can
only be caught by the cross-check against the placements, so between them they
prove both halves of gate 8 rather than the arithmetic twice. The other pair takes
the cross-check in both directions with the root recomputed each time: a published
role missing from the slice, and a present site the block does not carry. The
second of those is the one that keeps the projection rule honest — it claims for
the page exactly the value the committed sidecar holds for that coordinate, so a
verifier that read the artefact's shape where it should read the page's would pass
it. `second-charter.html` earns its place the same way: the first charter still
hashes correctly, so anything that stops at the first charter it finds reports a
clean page while the terms a reader is shown are ambiguous. The flipped charter
in the second shape is a pair with `page-sst-charter-field.html` for the same
reason: the refusal names a hash mismatch, not a missing charter, and that is what
shows the shape was read.

**The nine render-mode cases are chosen the same way, one per thing that could
quietly stop being checked.** Each surface gets the failure that is invisible to
every other gate: the stamp gone from a non-text atom, a letter changed inside an
attribute nobody reads as text, a composed label that no longer follows from the
atoms it names. Two of them recompute the composition root before they are
frozen, so the placement transcript agrees with itself and only the wrapper can
refuse them — the same discipline as the geometry pairs above. Two more are
matched: `reordered-atoms.html` swaps two atoms inside one wrapper, which is the
exact hole a subtraction-based gate 6 was measured to admit and the reason that
variant was rejected — every hash is still correct, gate 7 still sees the declared
blocks in the declared order, and only the declared atom order refuses it;
`render-descriptor-tampered.html` is its mirror, an edit that changes nothing a
reader sees and that the surface check is indifferent to, caught by the root
alone. Between them they say why the declaration is checked in two places and why
neither place would do on its own. `chrome-marked-atom.html` closes the marker
itself: chrome has its span cut from the residue, so an element allowed to be
chrome *and* carry an atom would be a way to hide an atom from its own check.

**The four furniture cases are a set, and the fourth is the interesting one.**
`undeclared-chrome-furniture.html` and `undeclared-free-text.html` are the two
holes the furniture root closed, frozen as they were found: a chrome-marked
paragraph of prose inside a wrapper, whose span was cut from the residue while
nothing bounded its text, and a visible paragraph between two wrappers, which sat
inside no wrapper's own markup and so inside no check. Both passed all nine gates
and matched the origin's roots. `edited-furniture-text.html` is the third way to
move furniture — edit a declared span in the page *and* in the list, so the two
faces agree and only the roots disagree — and it is the one case in this set that
must fail two gates rather than one, because two checks are what bind the page to
the root and the root to the list.

**`registry-hash-edited.html` takes the second trailing leaf**, and it is a pair
of checks rather than a doubling of one. The page names a registry whose hash
differs from the frozen table's in its LAST character — the adversarial shape, a
value that looks right at a glance — with the composition root left alone. Gate 6
refuses it because the table the page names is not the table this verifier
carries; gate 7 refuses it because the root over the trailing registry leaf no
longer recomputes. Gate 6 reports first. Neither check subsumes the other: gate 6
is silent where the *verifier* is the one out of date, and gate 7 is silent where
verifier and page agree on a table the origin never used. Measuring this vector is
also what showed the gate-6 message reading as though the two values agreed, since
it named both by their first eight characters; it names both in full now.

**`script-inside-wrapper.html` pins a strictness, not a gap.** The page-level
residue rule reads `<script>`, `<style>` and `<template>` as showing nothing — a
minified stylesheet in the body is not a sentence the page shows — so an inline
script declares no furniture and moves no root. The per-wrapper rule is
deliberately not relaxed the same way, and refuses one as text the block holds
besides its atoms. A block wrapper is the span in which "this block reconstructs
from its atoms and nothing else" is asserted, so scripts and styles belong outside
one; that is a conformance rule for emitters rather than a limitation of the
check, and this vector is what stops it being quietly relaxed into a convenience.

`consistent-furniture-rewrite.html` is not a refusal, and that is the point. It
carries the same injected paragraph as the first of them, *declared*: the
furniture list extended, `furniture_root` and `composition_root` recomputed. The
page is internally consistent, and every gate says so. What refuses it is that its
composition root is not the one the origin published — so the vector asserts
exactly that: all nine gates pass AND the composition root has moved. It is the
claim ladder's second rung frozen as bytes. If the furniture ever fell back out of
the composition root, this page would become indistinguishable from the original
and this vector would be the only thing left to say so.

**The provenance of all but the control and the two newest is worth stating.**
They are not hypotheticals written to make new gates look useful. Two of them come from a
second stranger red team of this branch, which found the two furniture holes by
running edits against the branch's own built page and watching all nine gates
pass. The rest come from the first: a static read of
`sst-kernel.mjs` by a stranger's model produced seven claims about what `verify`
did not check; every one was executed against the kernel's own built page, and
every one passed all six gates of the previous version and the DOM-text rule, exit
code 0. Gates 7, 8 and 9 exist because of that run, and these files are what stop
them decaying back into comments.

**One of those seven is no longer here, and its absence is a finding rather than a
retreat.** `edited-block-order.html` changed a block's `order` label to a value
the rendered sequence appeared to contradict, and the gate that refused it read
`order` as a page-wide position. It is not one: `order` is the row's position
inside its own SECTION. Simulated against the reference implementation's own home
page, that reading fired 39 times in 58 transitions on a page nobody had touched.
So the check is gone, `order` is declared and not verified at every version — the
`KERNEL.md`'s boundary says so — and the vector that asserted otherwise is deleted
rather than quietly re-frozen. A vector proving a gate that should not exist is
worse than no vector.

---

## Re-freezing

All three sets are frozen deliberately and never as a side effect. `v1-fixture/` is
production's to re-pin, not this repository's — the whole value of the set is
that the kernel did not compute it. `v1.2-manifest/` is regenerated from the
substrate frozen inside it, which is another way of saying it is not regenerated:
growing the live fixture must not move it, and if it ever does, the version axis
is broken and not the vector. `v1.3-manifest/` is regenerated from a build of
`substrate/`; if you regenerate it, read the diff first and say why in the commit
message. Its composition root has been redefined three times — the render
declaration folded into the placement leaf, then the furniture leaf appended, then
the registry leaf after it — while v1.3 is still pre-release and no artefact has
shipped under that name; after v1.3 ships,
that value is as frozen as any other and a change to it is a new version. `v1.3-manifest/refusals/` is stricter
again: regenerating a refusal file means regenerating the page it edits, and a
gate that has stopped refusing what it is frozen to refuse is a format change to
be argued for, never a vector to be re-cut — and if the argument is won, as it was
for `edited-block-order.html`, the vector is DELETED with the reason recorded, not
softened until it passes. A vector set that quietly re-freezes itself whenever it
disagrees with the code is not a vector set.

## A note on versions

v1.3 proceeds on the reading that a format version names the manifest schema and
the gate set together, while identities stay stable across versions — which is
why `v1-fixture/`'s v1.1 identities reproduce unchanged under a v1.3 kernel, and
why `v1.2-manifest/` must keep reproducing too. That reading is proposed rather
than settled; the alternative is a separate version number for the gate set.

v1.1 and v1.2 are shipped and their vectors are promises. **v1.3 is not shipped**
— it is the version this kernel emits and the version the reference artefact's
build now writes, but nothing has been released under that name — so its shape is
still being settled, and one value in it has already been redefined three times:
the composition root folds each placement's render declaration into its leaf, and
now also carries two trailing leaves, one over the page's furniture and one over
the registry its descriptors name. That is stated here rather
than buried in a commit, because the same edit after v1.3 ships would be a format
break rather than a draft revision, and the difference is the release, not the
arithmetic.
