# substrate/ — the fixture the kernel builds, and the traps built into it

Two CSVs. That is the whole substrate.

| file | carries | principle |
|---|---|---|
| `atoms.csv` | WHAT exists — `name,content` | content lives exactly once |
| `lattice.csv` | WHERE it appears — `page,section,block,role,atom_ref` | placement is composition, not content |

`node sst-kernel.mjs build` compiles these into `dist/index.html`. The page's
content **is** the explanation of the mechanism that proves the page, which is
the point: the demo artefact is its own documentation, and every sentence you
read there is an atom you can re-hash.

## Two pages, one published

`lattice.csv` declares two pages. Only `paper` is published; `notes` is a
**draft** — declared in the lattice, never rendered, never deployed. That is
not decoration. A draft coordinate is the ordinary case in a working artefact
(content exists before it is shown), and it is what makes three of the format's
sharpest rules observable in a fixture this small.

## Three deliberate superposition twins

Two lattice rows whose blocks hold identical atoms — *as published* — in
identical order Merkle to **the same block id**: the same identity at two
coordinates. That is Data
Superposition, and it is where implementations quietly disagree. The frozen
conformance fixture that preceded this one had **zero** superposed identities,
so its vectors could not see this class of defect at all. These three can.

### A · one identity, two placements on the SAME page

`superposition_1` is placed at `paper/superposition/note` **and**
`paper/colophon/note`. The page renders it twice; the manifest lists it **once**.

The colophon coordinate also declares a site the page withholds (below), so the
two coordinates are twins only in what they PUBLISH. That is the correct reading
and a trap in its own right: identity follows publication, so an implementation
that Merkled the substrate's atoms rather than the published ones would give these
two different ids and lose the superposition entirely.

*What it catches.* An implementation that emits one manifest entry per rendered
placement rather than per identity. Both readings look reasonable until you
measure: `block_count`, `atom_count` and `page_merkle_root` differ between them,
so two conformant-looking implementations produce different roots from the same
page. The manifest is a **bill of the identities the page carries, not a
transcript of its placements** — verifiers compare block SETS, and must not
infer placement counts from either face.

*What the label does.* Both coordinates agree on `page` (`paper`, which is
published, so it may be named) and on `name` (`note`); they disagree on
`section` and `order`. The manifest entry therefore carries `page` and `name`
and **omits** the other two.

### B · one identity at two coordinates, one of them UNRENDERED

The four `claim_*` atoms sit at `paper/claims/body` and again at
`notes/appendix/body`. Only the first renders.

*What it catches.* Two things at once. First, evidence-based selection: the
unrendered coordinate's block has the same hash as the rendered one, so a naive
"is this hash in the DOM evidence?" filter admits a block from a draft page into
a published manifest. Second, and worse, the label: no fact in the DOM can say
which of the two coordinates this rendering came from, so any implementation
that picks one is guessing, and a guess printed in a machine-readable manifest
is a false claim.

*What the label does.* The two coordinates disagree on `page`, `section` and
`order`, and agree only on `name` (`body`). The entry carries **`name` and
nothing else** — the strongest illustration of the rule that a claim which
cannot be verified is not made. It is also the case where guessing would name a
draft page in a published artefact.

### C · a HEAD-RENDERED identity, superposed

`paper/meta/seo` and `notes/meta/seo` hold the same title and description atoms.
The SEO block's atoms become `<title>` and `<meta name="description">` —
elements that cannot carry `data-atom-hash` at all — so the block is in the
manifest but has no DOM evidence, and gate 3's reverse direction must exempt it.

*What it catches.* The exemption predicate. Keyed the old way — *this block's
`page` equals the manifest's page, and section is `meta`, and name is `seo`* —
it silently stops firing here, because the two coordinates disagree about `page`
and the entry therefore has no `page` to match. Gate 3 then fails a page that is
perfectly conformant. Keyed on `section`/`name` alone, it fires correctly. The
two coordinates agree on `section`, `name` and `order`, so the entry carries all
three and omits only `page`.

Revert the predicate in `sst-kernel.mjs` and run `verify`: gate 3 fails on this
fixture, and on nothing else. That is the trap doing its job.

## One typed vacancy

`paper/geometry/body` declares a `detail` role whose `atom_ref` is the reserved
sentinel `_PENDING_`. A vacant site is **not a missing row** — it is a declared
site with an occupancy state. Sentinels are filtered out of the content spine
(they never enter a block id, the manifest, or the DOM) and feed the **geometry
spine** instead, a second Merkle root over every declared site, present or
vacant. `node sst-kernel.mjs seal` turns this one vacancy from `_PENDING_` into
`_NA_OMITTED_` and shows the geometry root move while the content root holds.

The three reserved sentinels are `_PENDING_` (not filled yet), `_NA_OMITTED_`
(sealed, revisitable) and `_NA_IMPOSSIBLE_` (foreclosed). This fixture uses one
of them; the frozen `vectors/v1-fixture/` uses all three, so the geometry
census exercises its full state enum somewhere.

## One withheld site

`paper/colophon/note` declares a `phone` role holding a real-shaped telephone
number. The page never prints it and the manifest never carries it: the site is
**withheld**, which is not a vacancy — the atom exists, the operator simply does
not publish it. (The number is drawn from the range reserved for fiction, so
nothing here belongs to anyone.)

What the page publishes is then a **projection** of the substrate's block: its
identity is the Merkle root over exactly the atoms published, and its geometry
slice lists exactly the roles published plus the vacancies declared. The
whole-artefact sidecar still records the site as `present`, because the artefact's
shape is not the page's shape.

*What it catches.* A verifier that reads the artefact's shape where it should read
the page's. Gate 8 asks that the roles a placed block publishes and the present
sites declared at that coordinate be the same set, both ways — so a slice valued
by the substrate's occupancy declares a present site the page does not carry, and
the gate refuses it. Withholding is not exotic: on the live reference artefact two
chrome blocks are projected on every page it serves, several of their contact
sites being withheld from the machine face by design. A rule that could not
express that would refuse the artefact this format was written for.

`vectors/v1.3-manifest/refusals/withheld-site-claimed-present.html` is this trap
frozen: the page's slice with the withheld site claimed present, its declared
geometry root recomputed so that arithmetic alone cannot catch it.

## The dialect

UTF-8, no BOM · LF line endings · header row · **row order is significant**
(row order is meaning; sorting is editing) · a field containing a comma is
quoted. The kernel's CSV reader is deliberately minimal — no escaped quotes, no
embedded newlines — because neither substrate needs them. Keep content free of
`"` and it stays parseable by the twelve-line reader you can audit in a minute.

## If you change anything here

The frozen vectors will refuse you, and that is the design:

```
node sst-kernel.mjs vectors
```

fails the moment the built manifest stops matching
`vectors/v1.2-manifest/expected.json` or `vectors/v1.3-manifest/expected.json`
byte for byte — the kernel emits both shapes from this substrate, and both are
frozen. Re-freezing is a deliberate act, never a side effect — regenerate it,
read the diff, and say why in the commit message.
