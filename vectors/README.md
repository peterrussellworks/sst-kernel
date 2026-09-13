# vectors/ — the frozen conformance vectors

Prose drifts. It drifted inside this project's own repository: at one point two
implementations computed different atom ids for smart-quoted text, used
different empty-Merkle conventions, and shipped charters with different numbers
of permission categories — while the prose describing them agreed perfectly.
Byte-exact vectors that any implementation must reproduce are the only binding
that does not rot.

`node sst-kernel.mjs vectors` runs the two FORMAT sets below. They have two
different provenances and prove two different things. **Which is which matters,
so it is stated here rather than implied.** A third set,
than the format itself; the kernel does not run it and it carries its own
checker.

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

**These values are marked format v1.1, and that is correct, not stale.** v1.2
moved the manifest SHAPE and the GATE SET and deliberately left identity alone:
normalization and the Merkle construction are untouched, so every v1.1 identity
survives the version bump unchanged. That these values still reproduce under a
v1.2 kernel is itself the claim being tested. The manifest inside
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

---


## Re-freezing

Both sets are frozen deliberately and never as a side effect. `v1-fixture/` is
production's to re-pin, not this repository's — the whole value of the set is
that the kernel did not compute it. `v1.2-manifest/` is regenerated from a
build of `substrate/`; if you regenerate it, read the diff first and say why in
re-freezes itself whenever it disagrees with the code is not a vector set.
