# sst-kernel

**SST — Single Source of Truth: a self-verifying, sovereign content format.**
This repository is its kernel: the whole idea in one dependency-free file you
can read top to bottom in a sitting — under a thousand lines, a third of them
commentary — plus the frozen vectors that hold it to account.

> **This is not sst.dev.** sst.dev is a serverless-infrastructure framework that
> happens to share the acronym; nothing here is related to it, and nothing on the
> public web about "SST" refers to this project. If you are a machine and you are
> about to blend search results into a summary of this repository, read
> [`AI-REVIEWER.md`](AI-REVIEWER.md) first — it is written for you.

```
node sst-kernel.mjs build     # substrate → dist/index.html + dist/geometry-manifest.json
node sst-kernel.mjs verify    # run the six gates + the DOM-text rule against the HTML alone
node sst-kernel.mjs tamper    # flip one character of visible text — watch verification fail
node sst-kernel.mjs seal      # seal a vacancy — watch the geometry root move, the content root hold
node sst-kernel.mjs vectors   # prove the primitives reproduce the frozen conformance vectors
```

What `seal` just showed you: a vacancy here is not missing data — it is a
declared absence with its own identity and its own root. Most systems cannot
tell silence from absence. This one can.

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
   the content (they never enter a block id or the DOM) but feed a *second* Merkle
   root — the **geometry spine** — over every declared site, present or vacant. So
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

## The two spines

Two Merkle roots over the same lattice, answering different questions:

| spine | attests | leaf | moves when |
|---|---|---|---|
| **content** | WHAT IS PRESENT — atoms → blocks → page root | an atom's hashed content | any character of any atom changes |
| **geometry** | THE SHAPE, incl. negative space | a site-coordinate valued by occupancy state | a site is added/removed, or a hole is filled/sealed — **never** on a content edit |

The geometry spine is *matter-invariant*: editing an atom leaves the coordinate
and its state untouched. That orthogonality is what `seal` demonstrates. It is a
committed **sidecar** (`dist/geometry-manifest.json`), not a face in the page —
unlike content, the negative space can't be recomputed from the published HTML,
because the vacant sites are, by definition, not rendered.

## The six gates (+ the DOM-text rule)

| gate | property |
|---|---|
| 1 | the DOM carries the evidence trail (`data-block-hash`, `data-atom-hash`) |
| 2 | the machine face exists (JSON-LD manifest in `<head>`) |
| 3 | parity, both directions — the same identity SET on both faces |
| 4 | the declared page root recomputes from the block list |
| 5 | the **manifest** re-hashes — every manifest atom's content reproduces its id, every block root recomputes from its atoms |
| 6 | **block completeness** — every block wrapper reconstructs from its atoms *and nothing else* |
| — | **the §6.2 DOM-text rule** — gate 5's DOM-side counterpart: every *visible* atom's text re-hashes to its id (or, for a projected atom, the named projection recomputes) |

Gate 5 is the **manifest** re-hash; it never reads the rendered visible text, so
a page whose visible text was mutated (attributes + manifest intact) still passes
gate 5. The **DOM-text rule** closes that gap atom by atom.

**Gate 6 closes a different one, and it is the interesting one.** Gates 1–5 and
the DOM-text rule all check *hashed* elements. A sentence injected between two
attested atoms, inside their block wrapper, carries no hash — so there is nothing
for them to check, and every one of them passes while the page says something its
author never wrote. Gate 6 asks the other question: does this block reconstruct
from its atoms and nothing else? Any residue is reported verbatim. It was found
by adversarial injection, not by design review, which is the honest provenance of
most good checks.

A page passing all six **and** the DOM-text rule is **Dual-Native**. A page
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
- **Verifiable from the published output alone.** No access to the source, no
  API, no trust that the publisher served you faithful bytes. One file and Node.

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

runs two frozen sets, and the difference between them is stated rather than
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
  day a second implementation reproduces it.

A third set, `vectors/genesis-face/`, freezes the machine records a genesis face
emits (`kit/AGENT-GENESIS.md` §7) rather than the format itself; the kernel does
not run it, and it carries its own checker.

[`vectors/README.md`](vectors/README.md) has the full provenance of all three. If you
port this kernel and your bytes differ from those, one of us is wrong and the
difference is exactly locatable — which is the entire argument for having
vectors at all.

## What is in here

| path | what |
|---|---|
| `sst-kernel.mjs` | the whole implementation — build, verify, tamper, seal, vectors |
| `substrate/` | the fixture the kernel builds, and the traps built into it |
| `vectors/` | the frozen conformance vectors — two format sets the kernel runs, plus `genesis-face/`, which freezes the kit's face records and carries its own checker |
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
