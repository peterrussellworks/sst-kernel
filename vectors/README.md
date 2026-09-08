# vectors/ — the frozen conformance vectors

Prose drifts. It drifted inside this project's own repository: at one point two
implementations computed different atom ids for smart-quoted text, used
different empty-Merkle conventions, and shipped charters with different numbers
of permission categories — while the prose describing them agreed perfectly.
Byte-exact vectors that any implementation must reproduce are the only binding
that does not rot.

`node sst-kernel.mjs vectors` runs the three FORMAT sets below. They have
different provenances and prove different things. **Which is which matters, so it
is stated here rather than implied.** A further set,
[`genesis-face/`](genesis-face/), freezes a layer built on the format rather
than the format itself; the kernel does not run it and it carries its own
checker.

The third format set adds a kind of vector the first two do not have: a **refusal
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

**The composition root moved, and the version did not.** The placement leaf was
`sha256(block ␟ section ␟ name)` when this set was first frozen; it is now
`sha256(block ␟ section ␟ name ␟ R)`, where `R` is a Merkle root over
`sha256(atom-hash ␟ render descriptor)` in the order the placement printed them.
Folding the render declaration into the leaf is what makes a forged or swapped
mode move a root instead of moving nothing. That is a redefinition of a published
value, and it is being made **without a version bump on purpose**: no
implementation has shipped v1.3 publicly — the reference artefact emits v1.3
fields but has not been released under that name — so v1.3 is still pre-release
and this is a change to a draft, not a break of a promise. Every atom, block and
page root is byte-identical across the change; only `composition_root` and the
placement entries moved. The moment v1.3 ships, this is the last time that leaf
can change without a new version.

The kernel's own fixture also grew — four blocks and eleven atoms — so that every
render mode is exercised by something the kernel actually builds rather than
described in prose: a matter-hash atom stamped on a `<picture>` and showing
nothing, an `alt` carried on the `<img>` nested inside it, a rating whose atom is
`5` and whose rendered form is the label a screen reader announces, three
taxonomy atoms composed into one label by a registry transform, a placement that
prints two of its block's three atoms and prints them backwards, and a
chrome-marked element inside a wrapper. `v1-fixture/` and `v1.2-manifest/` are
untouched by that growth, which is what the pinned v1.2 substrate above is for.

What it pins, in `expected.json`:

- the **page manifest** — 12 block identities (the 7 the v1.2 set pins, the 4 new
  mode-bearing blocks, and the synthesized charter attestation block), 11
  placements, 20 geometry sites, `version: "1.3"`, and three roots rather than
  one: the page root, the **composition root** over the placement transcript, and
  this page's own **geometry root** over the sites its placements define. The
  whole-artefact geometry sidecar is unchanged by v1.3 and stays frozen in
  `v1.2-manifest/`.
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

The nine sites are the sites of the seven coordinates the page PLACES — the roles
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
decoration: twelve of the thirteen files in `refusals/` are that page with one
edit, so a page that drifted would turn the refusal set into a test of nothing. `vectors`
rebuilds it byte-for-byte, and checks it passes all nine gates, before it trusts
a single refusal.

`page-sst-charter-field.html` is the thirteenth file's subject and a vector in its
own right: the same terms served in the OTHER charter shape — an entity document
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

Twenty-two files, each a frozen page with ONE edit, each declaring in
`expected.json` the exact list of checks `verify` must report as failed — so a gate that stops
refusing, starts refusing something else, or starts refusing two things at once
all show up as drift rather than as a quiet pass.

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
| `missing-non-text-stamp.html` | the stamp removed from the element bearing a non-text atom | gate 6 |
| `attribute-value-changed.html` | one letter changed inside the attribute an atom is carried in | gate 6 |
| `transform-label-changed.html` | a composed label edited away from what the registry transform makes of its atoms | gate 6 |
| `partial-placement-overclaims.html` | a partial placement claiming an atom the wrapper does not show, root recomputed | gate 6 |
| `reordered-atoms.html` | two atoms swapped *inside* one wrapper, each still re-hashing | gate 6 |
| `chrome-marked-atom.html` | an element marked as chrome while carrying an atom stamp | gate 6 |
| `placement-claims-foreign-atom.html` | a placement naming an atom its block does not hold, root recomputed | gate 6 |
| `render-descriptor-tampered.html` | a render descriptor edited with the composition root left alone | gate 7 |

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

**The provenance of all but the control is worth stating.** They are not
hypotheticals written to make new gates look useful. A static read of
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
README's boundary says so — and the vector that asserted otherwise is deleted
rather than quietly re-frozen. A vector proving a gate that should not exist is
worse than no vector.

---

## `genesis-face/` — the machine channel of a genesis face, frozen by this kernel

**Provenance: computed by THIS repository, over a synthetic example. A freeze,
not an agreement**, on the same terms as `v1.2-manifest/`. It is a set about the
KIT rather than about the format: `kit/AGENT-GENESIS.md` §7 describes a genesis
face's machine channel — the page manifest, the proto-charter, the emission
record — and described it in prose alone until the first stranger to run the
document cold had to invent all three shapes for himself.

What it pins: the `@type` vocabulary and required fields of those three
records, plus the face declaration that ties them together; and a reproduction
rule under which every identity in the set recomputes from the set alone — atom
ids from their canonical text, a projected block root from exactly the atoms a
face rendered, `projected_from` from every atom the crystal block holds, the
page root from the block hashes, the crystal root from the bill of materials.

It is **not** run by `node sst-kernel.mjs vectors`: the kernel is the format,
and a kit layer has no business inside it. Run it on its own —

```
node vectors/genesis-face/check-genesis-face.mjs
```

— which reproduces §4.1's 18 frozen vectors with its own transcription of the
primitives before it hashes anything in the set.
[`genesis-face/README.md`](genesis-face/README.md) states what binds, what is
illustrative, and the one value that structurally cannot recompute.

---

## Re-freezing

All four sets are frozen deliberately and never as a side effect. `v1-fixture/` is
production's to re-pin, not this repository's — the whole value of the set is
that the kernel did not compute it. `v1.2-manifest/` is regenerated from the
substrate frozen inside it, which is another way of saying it is not regenerated:
growing the live fixture must not move it, and if it ever does, the version axis
is broken and not the vector. `v1.3-manifest/` is regenerated from a build of
`substrate/`; if you regenerate it, read the diff first and say why in the commit
message. Its composition root has been redefined once, while v1.3 is still
pre-release and no artefact has shipped under that name; after v1.3 ships, that
value is as frozen as any other and a change to it is a new version. `v1.3-manifest/refusals/` is stricter
again: regenerating a refusal file means regenerating the page it edits, and a
gate that has stopped refusing what it is frozen to refuse is a format change to
be argued for, never a vector to be re-cut — and if the argument is won, as it was
for `edited-block-order.html`, the vector is DELETED with the reason recorded, not
softened until it passes. `genesis-face/` moves only when the §7
contract itself moves, and its own README says so in the same words. A vector set
that quietly re-freezes itself whenever it disagrees with the code is not a vector
set.

## A note on versions

v1.3 proceeds on the reading that a format version names the manifest schema and
the gate set together, while identities stay stable across versions — which is
why `v1-fixture/`'s v1.1 identities reproduce unchanged under a v1.3 kernel, and
why `v1.2-manifest/` must keep reproducing too. That reading is proposed rather
than settled; the alternative is a separate version number for the gate set.

v1.1 and v1.2 are shipped and their vectors are promises. **v1.3 is not shipped**
— it is the version this kernel emits and the version the reference artefact's
build now writes, but nothing has been released under that name — so its shape is
still being settled, and one value in it has already been redefined: the
composition root now folds each placement's render declaration into its leaf. That
is stated here rather than buried in a commit, because the same edit after v1.3
ships would be a format break rather than a draft revision, and the difference is
the release, not the arithmetic.
