# R4 — the word-granularity falsifier

**This is a protocol, not a transcript.** It states a question, a method, and a
set of expectations frozen by actually running the method once. Run it again
against your own clone and you should get the same numbers. If you don't, that
is a finding — see the contract at the bottom.

## The question

The atom boundary is fixed at the sentence: "the atom is the smallest unit you
would want to cite, verify, or address — a clause or a sentence, never the
smallest unit text can be divided into." Is that the right boundary, or would
splitting further, to the word, serve the format better? Word-level atoms are
not hypothetical — they are the obvious next move for anyone who reads "content
lives once, identity is a hash" and reaches for the finest grain available. This
report runs that move at fixture scale and reports what happens, not what was
guessed in advance.

## The method

1. Copy the three identity primitives — `normalize`, `atomId`, `merkleRoot` —
   out of `sst-kernel.mjs` verbatim. Both granularities in this experiment share
   the exact same identity rules; only the atomisation step differs.
2. Load `substrate/atoms.csv` and `substrate/lattice.csv`. Scope to the
   **published page's body**: `page == "paper"`, the head-rendered `meta/seo`
   block excluded (its atoms become `<title>`/`<meta>`, which cannot carry a
   per-word span either way), the one declared vacancy (`_PENDING_`) excluded
   (a vacant site has no content to split). This is exactly what
   `node sst-kernel.mjs build` renders into `<body>`.
3. **Sentence-level** is what the lattice already gives you: one placement per
   row, one atom id per unique `atom_ref`, one `<TAG data-atom-hash>` element
   per atom, one block wrapper per `page/section/block`.
4. **Word-level**, charitable split (word-level's best case, not a strawman):
   `normalize()` the atom's content first — trim, collapse whitespace runs to
   one ASCII space, fold smart quotes, NFC. After that pass the *only*
   remaining separator is a single U+0020, so `content.split(' ')` gives an
   unambiguous token boundary and punctuation stays attached to the word it
   abuts (`page.`, `identity,` are each one token). A **detached** rule, where
   punctuation splits into its own atoms, only widens every gap measured below
   — it is not run here because the charitable rule already loses.
5. Hash every token with the same `atomId`. A repeated token anywhere in the
   scope — `"the"` in one sentence, `"the"` in another — is one atom
   (superposition applies to words exactly as it applies to sentences).
6. Render both forms of the body: sentence-level as `sst-kernel.mjs`'s
   `renderBody` already does; word-level as one `<span data-atom-hash>` per
   token, joined by a single literal space inside each block's wrapper — the
   only spacing choice under which a reconstruction check even has a chance of
   matching.
7. **Run the gate.** Copy gate 6's rule (`blockCompleteness` in
   `sst-kernel.mjs`) verbatim: a block's own visible text, tags stripped and
   normalized, must equal its atoms' content joined by one space. Run it over
   one real multi-atom block (`abstract/body`, two sentences) at both
   granularities, twice each — once untampered, once with one extra word
   spliced between two already-attested spans, inside the block wrapper,
   attested by nothing.
8. Pick one real sentence (`abstract_2`) and compare its handle at both
   granularities: the sentence-level atom id, versus whatever a word-level
   reader would have to point at instead.

Nothing in this method touches the real substrate, `sst-kernel.mjs`, or
`vectors/`. It runs in a scratch copy and only this report lands in the
repository.

## Falsification criteria

The sentence-level boundary is challenged, not confirmed, if any of the
following hold when the method above is actually run:

- word-level placement and unique-atom counts do **not** substantially exceed
  sentence-level's (semantic noise is not real at fixture scale);
- the rendered word-level body is **not** substantially heavier than the
  sentence-level body (the weight argument doesn't hold);
- gate 6 **fails to catch** the stray-word injection at sentence level (the
  gate that exists to close this hole doesn't close it, at any granularity —
  a finding about the kernel, not about word-level);
- gate 6 **also fails to catch** the same injection at word level while
  catching it at sentence level (a granularity-specific hole survives the gate
  that was built to close it — this would REOPEN the reconstruction argument
  in full, beyond the shape-only form (c) below settles for);
- the chosen sentence has some other stable, content-addressed handle at word
  level after all (the citation-identity argument doesn't hold).

## What was measured

Four things are measured below: semantic noise, weight, reconstruction, and
citation identity. Three come back exactly as the falsification criteria above
anticipate. The fourth — reconstruction — holds only in part: gate 6 catches
the stray-word injection at both granularities, so the splice attack itself
does not distinguish the two grains; what still stands is the shape argument,
given in (c).

**(a) Semantic noise — CONFIRMED.** 13 sentence-level placements over 12 unique
atoms explode to 317 word placements over 175 unique word-atoms — a 24.4×
placement multiplier, 14.6× more unique atoms — and 44.8% of every word
placement is a **repeat** of an existing word-atom. The most-superposed atoms
are exactly the function words: `"the"`×22, `"is"`×16, `"a"`×10, `"of"`×8,
`"this"`×7, `"page"`×7, `"and"`×7, `"in"`×6. An atom table addressed at word
grain stops being a set of citable claims and becomes a word-frequency
concordance: `"the"` is one atom addressed from twenty-two coordinates.

**(b) Weight — CONFIRMED.** The rendered body grows 8.59× (3,810 B → 32,742 B)
for the same 7 blocks. Per-word DOM chrome measures **103.3 B/word** — the
`data-atom-hash="` + 64 hex + `"` attribute alone is 81 bytes before the tag,
the word, or the closing tag are counted. The atom-list JSON (hash + role +
order + content, one entry per atom — the shape the manifest's `atoms` array
uses) inflates **12.23×** (3,542 B → 43,314 B): 305 more atoms means roughly
305 more manifest entries, and the growth tracks the word count, not a fixed
multiple.

**(c) Reconstruction — CLOSED AT BOTH GRANULARITIES.** A stray word spliced
between two correctly-hashed atom spans, inside their block wrapper, does
**not** pass this kernel's checks, at either granularity: gate 6 compares a
block's whole visible text against its atoms' content joined by one space, and
it does not care how big the atoms are. Splicing `STRAY_INJECTED_WORD`
between the two sentence atoms of `abstract/body` fails gate 6 (residue caught);
splicing the same word between two word-atom spans in the word-level rendering
of the identical block **also** fails gate 6 (residue caught). Gate 6 exists
to close exactly this hole, and it closes it regardless of atom size — that is
a fact about gate 6, confirmed here rather than assumed.

What survives is real: word-level
atomisation is renderable **only** as one atom-span per word inside a single
container element — the shape the format's own composition rule (one atom, one
element; SPEC §2.7) already retires for exactly this reason. That a currently-
shipped gate happens to catch one specific attack against it is not the same
claim as the shape being conformant, and the method above does not confirm the
shape — it confirms that a stray word doesn't sneak past this kernel's gates
today, at any grain. A different gate, or a differently-swallowed stray
character, is not ruled out by one experiment; it is exactly the kind of thing
this report exists to make someone go and check.

**(d) Citation identity — CONFIRMED.** `abstract_2` — a real 29-word sentence in
the shipped substrate — has one atom id at sentence level: a single,
content-addressed hash that names that claim and nothing else. At word level it
has none. The only available stand-in is an ad-hoc Merkle root over the run of
29 word-atom hashes, in lattice order — and that root is **positional**, not
content-addressed: the identical 29 words in reverse order hash to a different
root, because a Merkle root over an ordered list is a claim about order as well
as content, and "this is the sentence `abstract_2`" was never a claim about
order. The only other candidate handle is the *block's* id — `abstract/body` —
which covers **both** sentences in that block and moves on an edit to either
one. Push the atom below the sentence and the thing worth citing no longer has
an atom of its own; the smallest available handle is either positional and
fragile, or too coarse to name the claim you meant.

## Frozen expectations

Computed by running the method above, twice, from two independent clean copies
of `substrate/`. Both runs produced byte-identical output.

```
sentence placements: 13
sentence unique atoms: 12
word placements: 317
word unique atoms: 175
placement multiplier: 24.38x
unique-atom multiplier: 14.58x
repeat fraction of word placements: 44.8%
top word atoms by placement count: "the"×22, "is"×16, "a"×10, "of"×8, "this"×7, "page"×7, "and"×7, "in"×6

sentence-level body: 3810 bytes (7 blocks, 13 atoms)
word-level body: 32742 bytes (7 blocks, 317 word-atoms)
body growth: 8.59x
DOM chrome per word: 103.3 B/word
sentence-level manifest atoms JSON: 3542 bytes
word-level manifest atoms JSON: 43314 bytes
manifest inflation: 12.23x

sentence-level, untampered: gate6 PASS
sentence-level, tampered (stray word between atoms): gate6 FAIL — residue caught
word-level, untampered: gate6 PASS
word-level, tampered (stray word between word-spans): gate6 FAIL — residue caught

sentence "abstract_2" (29 words): atom id ab001c7421818cc1145721f09da425f50ad4b57ec975d0087c852e0be9a87fac
word-level: 29 word atoms, no single atom id for the sentence
ad-hoc positional run-root over the 29 word hashes: e64c1f36084ba5cee46be9c0d2ec12bf0ba50fb7f9e05839b8747f4676fa29d7
the enclosing block's own id (abstract/body, BOTH sentences): ed74b0559afa27aee630d29e21bdf1ade0872bb6d743544a5d87247dee68448b
same word set, reversed order: run-root 91c5fb382316ea84b392ee66bc4e2cf8701a94de6b1b9661cfad3135faeb95db (DIFFERENT — the run-root is positional, not content-addressed)
```

## The contract

If you run the method above against an unmodified clone of this repository and
your numbers differ from the block above, that is a finding, not a rounding
error — `substrate/` is frozen the same way `vectors/` is, so a divergent
result means either your harness took a different scope than the one described
in step 2 above, or something about the primitives has drifted. Report it the
way `CONTRIBUTING.md` asks: say exactly what you ran and what you observed. The
prose in this file — the reading of what the numbers mean — is not frozen and
is not binding on you; the eight lines of numbers above are.

## Reproduction

There is no script in this repository that produces the block above — writing
one, from the method in this file, over your own copy of `substrate/`, is the
point. The kernel's own primitive sanity check is `node sst-kernel.mjs
vectors` (green); a harness built on primitives that fail that check first is
not testing this format.
