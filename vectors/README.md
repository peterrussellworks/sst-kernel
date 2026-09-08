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

What it pins, over `substrate/`:

- the **page manifest** — 7 block identities, 14 atoms, `version: "1.2"`,
  and the three superposition twins' labels: one entry keeping `page` + `name`,
  one keeping `name` alone, one keeping `section` + `name` + `order` with no
  `page`. `substrate/README.md` says what each twin exists to catch.
- the **geometry spine** — 14 sites, 10 blocks, across both the published page
  and the draft one.

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

What it pins, in `expected.json`:

- the **page manifest** — 8 block identities (the 7 the v1.2 set pins, plus the
  synthesized charter attestation block), 7 placements, 9 geometry sites,
  `version: "1.3"`, and three roots rather than one: the page root, the
  **composition root** over the placement transcript, and this page's own
  **geometry root** over the sites its placements define. The whole-artefact
  geometry sidecar is unchanged by v1.3 and stays frozen in `v1.2-manifest/`.
- the **charter** — including the attestation that names the atom and the block
  under which its terms are hashed. Flip a permission and this file moves.

The nine sites are the sites of the seven coordinates the page PLACES — the roles
it prints, plus the one vacancy those same blocks declare. The two head-rendered
sites (`meta/seo`) are not among them: the page places no such block, so the slice
makes no claim about it, and the whole-artefact sidecar is where every site on
every page is still counted. That is a narrowing from the earlier freeze, and it
is deliberate — a slice keyed on the lattice page rather than on the placements
publishes sites the page cannot show, which on any composed page turns gate 8 into
a refusal of ordinary composition.

And, beside them, `page.html` — the exact bytes the kernel builds. That is not
decoration: nine of the ten files in `refusals/` are that page with one edit, so a
page that drifted would turn the refusal set into a test of nothing. `vectors`
rebuilds it byte-for-byte, and checks it passes all nine gates, before it trusts
a single refusal.

`page-sst-charter-field.html` is the tenth file's subject and a vector in its own
right: the same terms served in the OTHER charter shape — an entity document
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

Ten files, each a frozen page with ONE edit, each declaring in `expected.json` the
exact list of checks `verify` must report as failed — so a gate that stops
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
| `flipped-charter-permission.html` | one permission flipped in the served charter, the attested copy left alone | gate 9 |
| `deleted-charter.html` | the charter declaration deleted outright | gate 9 |
| `sst-charter-field-flipped.html` | one permission flipped in a charter served in the other shape (on `page-sst-charter-field.html`) | gate 9 |
| `edited-visible-text.html` | the control — one letter of visible text | gate 6 + the DOM-text rule |

The two geometry cases are a matched pair on purpose. Removing a site with the
root left alone is caught by the root; adding one with the root *recomputed* can
only be caught by the cross-check against the placements, so between them they
prove both halves of gate 8 rather than the arithmetic twice. The flipped charter
in the second shape is a pair with `page-sst-charter-field.html` for the same
reason: the refusal names a hash mismatch, not a missing charter, and that is what
shows the shape was read.

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
that the kernel did not compute it. `v1.2-manifest/` and `v1.3-manifest/` are
regenerated from a build of `substrate/`; if you regenerate either, read the diff
first and say why in the commit message. `v1.3-manifest/refusals/` is stricter
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
