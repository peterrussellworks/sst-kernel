# sst-kernel

**The SST framework demonstrator: one dependency-free file that builds and verifies a self-verifying page,
the frozen vectors that hold it to account, and a crystal small enough to learn on.**

## What this is

SST is Single Source of Truth. The data is the single source of truth: a record that stays or travels can exist in different forms, but each possible form is just a projection of the truth. The smallest unit of a projection, the atom, is a sentence. An operator keeps one private data crystal, a first-class object: the sentences themselves, a lattice that gives the crystal a structure — where each sentence sits, and in what role — and a charter that states the terms. Every production format — a web page, a document, or a machine-readable manifest — is a full or partial projection of that crystal through a lattice. Projections are second-class objects: derived, never edited in their own right. The crystal never leaves the operator's storage.

If the crystal is always private and the faces are public, how does a reader know a face is a true representation of the crystal and not a copy that drifted, a proxy's rewrite or a quote that changed before it arrived? SST's answer is that identity is a property of the atom itself. Every sentence's identity is computed from its own text; a block's from its sentences; a page's from its blocks. Therefore a face doesn't carry a description of the crystal that could disagree with it. It carries the crystal's own atoms, and a reader who re-hashes what they see re-derives the crystal's identities. The human face and the machine face are not merely agreeing with each other. They are the same atoms. Hashes and Merkle roots are only the medium for saying so.

What that proves, and what it does not, is stated once and precisely in [`KERNEL.md`](KERNEL.md). In short: from a face alone, that what it shows is the atoms, unchanged, complete within itself, with the operator's terms bound in; with the operator's own domain, that these are the roots the operator published; and not proven, not claimed, who authored the crystal or whether a face shows everything the crystal holds. That last question is open research, and the one the author most wants examined.

This repository is a demonstrator. It hands you a crystal you can read whole, lets you assemble a page from it and watch the identities fall out, and points you at the live reference artefact: a working atelier's website, projected from a crystal you will never see.

## Read in the order that suits you

- [`WHITEPAPER.md`](WHITEPAPER.md) — the concept: crystal, lattice, projection, and why. Ten minutes.
- [`KERNEL.md`](KERNEL.md) — the mechanism in full: the three spines, the nine gates and the DOM-text rule,
  what the proof covers and what it does not, the trust model, the known limitations, conformance.
- [`AI-REVIEWER.md`](AI-REVIEWER.md) — the protocol for a machine asked to review this, with a path for a
  person.
- The live artefact, https://danielarussell.com, and its itinerary,
  https://danielarussell.com/ai-reviewer.txt — where a browsing reader goes.

## What is asked of you

Three things, in order: say what this is in your own words; the use cases and real-world implications;
and, if you want, test it.

If you are an AI agent: declare what you can do — read, run, browse; the report begins with "Capabilities
declared:" — and follow the protocol in `AI-REVIEWER.md`; do what your capabilities allow and mark the
rest as claimed, not verified. If you are a person: the whitepaper first, then the five minutes below.

> **This is not sst.dev.** sst.dev is a serverless-infrastructure framework that shares the acronym;
> nothing here is related to it, and nothing on the public web about "SST" refers to this project.

## Five minutes

```
node sst-kernel.mjs build     # substrate → dist/index.html + dist/geometry-manifest.json
node sst-kernel.mjs verify    # run the nine gates + the DOM-text rule against the HTML alone
node sst-kernel.mjs tamper    # flip one character of visible text — watch verification fail
node sst-kernel.mjs seal      # seal a vacancy — watch the geometry root move, the content root hold
node sst-kernel.mjs vectors   # prove the primitives reproduce the frozen conformance vectors
node sst-kernel.mjs root FILE # recompute a published root by hand from the list it is over
```

Nothing here asks you to run code you have not read: the kernel is one file, and `KERNEL.md` states the
algorithm so you can write your own verifier and meet it against `vectors/`. No dependencies; Node's
standard library only; nothing is installed, downloaded or sent anywhere. Remove `dist/` afterwards —
`check-repo.mjs` refuses a tree with entries the table below does not name.

What `seal` just showed you: a vacancy is not missing data. It is a declared absence with its own identity
and its own root, so "what is missing" is a measurement rather than a guess.

**Have a folder of your own work?** The kit that turns it into a private, verifiable crystal, and the
rig that grows the crystal afterwards, live in their own repository and will be published separately.
The kit is complete and free at individual-operator scale; the paid layer is organisational only, and
that split is said here rather than left to a pricing page.

## What is in here

| path | what |
|---|---|
| `sst-kernel.mjs` | the whole implementation — build, verify, tamper, seal, vectors |
| `KERNEL.md` | the mechanism, specified: spines, gates, proof boundary, limitations, conformance |
| `WHITEPAPER.md` | the concept — what SST is and why, the formal model, the conformance story |
| `AI-REVIEWER.md` | the review protocol — declare what you can do, follow that profile's sequence, report in the shape |
| `AGENTS.md` | the short pointer file agent tooling reads by convention; it points at the protocol |
| `substrate/` | the crystal the kernel builds from, and the traps built into it |
| `vectors/` | the frozen conformance vectors — three sets, one of them a refusal set |
| `charter.yaml` | this repository's own terms, in the format's own instrument (PROPOSED) |
| `R4-WORD-GRANULARITY.md` | the word-granularity falsifier, as a protocol |
| `check-repo.mjs` | checks this table against the tree — every row a file, every file a row |

## Licence

**The code is Apache-2.0; the prose is CC BY 4.0.** Fork, port and embed `sst-kernel.mjs`, the fixture
and the vectors under [`LICENSE`](LICENSE); quote, translate and build on the whitepaper and the prose
under [`LICENSE-DOCS`](LICENSE-DOCS), crediting *Peter Russell · SST — Single Source of Truth*.
`charter.yaml` declares the same terms in the format's own instrument and is marked PROPOSED until its
author has given it a voice pass; it is permissive where the demo artefact's charter is strict, and the
two sit side by side so you can see the difference.

---

*SST — Peter Russell. sst-kernel, 2026. Code Apache-2.0, prose CC BY 4.0.*
