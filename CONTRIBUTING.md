# Contributing

This repository is a content-addressed format with frozen conformance vectors, not
an ordinary open-source project accepting patches by majority taste. Read this
before opening anything — it says which kinds of contribution land, which are
declined on principle rather than on quality, and why the difference is not
bureaucracy but the format's own logic applied to itself.

## Findings are welcome

A bug, an unclear paragraph, a cold run of `kit/AGENT-GENESIS.md` that didn't go
the way the document predicted, a vector that doesn't reproduce on your machine,
a claim in `README.md` or `WHITEPAPER.md` that overstates what the gates actually
prove — these are wanted reports, not tolerated ones. An edit to a page that all
nine gates accept and that a reader would call tampering is the most valuable
report of all: the two furniture holes were found that way, by a stranger running
edits against the built page rather than reading about it. `README.md`'s **Known
limitations and open research questions** is the list to attack first, and its
being a list is an invitation. Open an issue and say
exactly what you ran and what you observed, the same discipline this repository
asks of its own agents (`AGENT-GENESIS.md` §10: "a run that reports a pass it did
not observe has broken the only thing this document is for"). A report that says
"this failed, here is the exact output" is more useful than a patch that papers
over the symptom.

## Format changes: not by pull request

`vectors/` is frozen, and `sst-kernel.mjs`'s identity primitives — atom hashing,
Merkle composition, the gate set, the geometry and composition spines, and the two
trailing leaves the composition spine now carries — the page's furniture root, and
the `registry_hash` naming the table its render descriptors refer to — are what the
vectors hold to account. The gate set is the nine gates plus the DOM-text rule,
and what each one covers is stated in `README.md`; a change to what any of them
accepts or refuses is a format change, including the page-level residue rule gate
6 gained with the furniture root. So is the shared transform registry, the closed table
of content→display transforms between the two marker comments in
`sst-kernel.mjs`: its bytes are hashed as a vector precisely so that a second
implementation can vendor them and prove the copy equal, which an edit here would
silently break for everyone who already has. Adding a transform is a format
change like any other, and it happens the way the rest of them do, below. That includes the refusal vectors: a change that
makes a gate stop refusing what it is frozen to refuse is a format change, not a
fix.

One rule is worth naming here, because it is the one most likely to arrive as a
patch. **Gate 6's per-wrapper residue rule is strict about inert elements on
purpose**: the page-level rule reads `<script>`, `<style>` and `<template>` as
showing nothing, and the per-wrapper rule does not. An inline script or style
inside a block wrapper is residue, and the page is refused. That is a conformance
rule for emitters — a block wrapper carries content and nothing else, and scripts
and styles belong outside one — not a gap in the check, and
`refusals/script-inside-wrapper.html` freezes it. Relaxing the wrapper to admit
them widens the single span in which the format asks an emitter to keep a
completeness claim clean, so it is a format change to be argued for as an issue,
never a one-line fix. A pull request that changes anything under `vectors/`, or changes what
those primitives compute, will be declined on principle, not on quality. It does
not matter how correct, well-tested, or well-argued the change is.

This is not gatekeeping for its own sake. The whole claim of a content-addressed
format is that two independent implementations either reproduce the same roots or
one of them is wrong — there is no room in that claim for a format with two live
variants under review at once. Format changes happen by **operator ruling**:
Peter Russell decides, the vectors move (or a new frozen set is added beside the
old one, versioned, never overwritten), and the change is dated and reasoned in
the repository's own record. A pull request is a request for someone else to
adjudicate; a frozen vector is the adjudication already made. Propose the change
as an issue — argue for it in prose — and it will be considered on those terms.

## The kit: propose, the operator adopts

`kit/` — the genesis pipeline, the rig, the validator pattern catalogue — is less
frozen than the format, but it still does not evolve by merge-on-approval. It
evolves the way its own documents already describe: **run it, see what breaks,
file the fix.** Open an issue describing what broke, what you expected, and, if
you have one, a proposed fix. The operator adopts it in their own surface, on
their own timeline, the same way a genesis run adopts nothing until the operator
says so (`kit/AGENT-GENESIS.md` §8). A pull request against `kit/` may still be
useful as a concrete proposal to read — but it is a proposal, not a merge queue
entry, and silence on it is not a rejection.

## Conduct

Be civil, be specific, and assume good faith. Disagreement about the format's
design is welcome — that's what the issue tracker is for. Making it personal
isn't, and shouldn't need saying twice.

## Licence

Contributions to code and vectors are made under [`LICENSE`](LICENSE)
(Apache-2.0); contributions to documentation and specification prose are made
under [`LICENSE-DOCS`](LICENSE-DOCS) (CC BY 4.0). Both files state the actual
terms — this document doesn't restate them.
