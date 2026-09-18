# The boundary decision

This engine hands captured web pages to a model. A clipped page is untrusted
text written by someone else, and a model reading it can be instructed by it.
That is the whole threat, and everything below follows from it.

## What a synthesis transport is given

A synthesizer writes wiki pages, so it must write files. There is no
configuration in which it both writes the pages and cannot write anything: the
safe posture and the task are mutually exclusive. The transports this engine can
drive run with the filesystem open, and with a network path of their own. So a
prompt-injection payload inside a captured page can, in principle, make the
model read whatever the account running it can read, and send it out through the
model channel.

Read-only passes are different and are configured differently: grading, triage
and classification need no tools, and they run in their transport's plan or
sandbox mode, where a tool request from an injected payload blocks instead of
being approved.

## What still holds when that happens

Four things, none of which depend on the model behaving:

- Writes are confined to the ingest worktree, which is a throwaway checkout.
- The validator accepts only paths inside the configured page directories plus
  the index, refuses a page already marked reviewed, and refuses a change that
  drops a contested-belief entry.
- A human reads every diff before it is committed.
- Grading never reads back what wrote a page: the author and the verifier are
  different model families, and the check is on who actually wrote it rather
  than on who was configured to.

## Why the shipped decision refuses

`boundary-decision.json` ships as `CODEX_DISABLED`. The risk above is not the
engine's to accept - it is accepted by a person, on a particular machine, with
particular data on it, for a particular corpus of clips. A default that granted
it would be this repository accepting it on behalf of everyone who installs it.

The floor is `--manual`, the interactive synthesizer: it starts no model, spends
no credits, needs no boundary decision, and runs the same validator and the same
review gate.

## What an operator who wants a model synthesizer is accepting

Write your own decision inside your data directory and point
`clips.boundaryDecision` at it in `syntopica.config.json`; the engine's copy
stays refusing and is used only when that key is null. Record which mechanisms
you evaluated, the probe rows that justify an enabled decision, and - if you are
overriding rather than sandboxing - say so in the justification and state what
you accepted. The reader re-checks the rows rather than trusting the verdict,
and a hand-edited verdict with no evidence behind it is refused.

Two properties are worth keeping whatever you decide: prefer transports that do
not retain your data, and never hand a private page to any of them. This engine
refuses the page directories a configuration marks sensitive ahead of every
other check, with no override flag.
