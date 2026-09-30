# Worker synthesis contract

`CLIPS_SYNTHESIS_RUNNER=worker` (or `runners.synthesis: "worker"`) sends each
clip to the instance's worker instead of an agent CLI. This page is what the
worker has to provide for that to run, written for whoever maintains the worker
and its instance configuration. The engine side is in `src/worker-synthesis/`.

## What the engine sends

Two `inference` jobs per clip, contract v1, on one queue:

| Field          | Value                                                                    |
| -------------- | ------------------------------------------------------------------------ |
| `kind`         | `inference`                                                              |
| `queue`        | `clips.synthesis`                                                        |
| `privacy`      | `personal` - the prompt carries the wiki's own index and pages           |
| `priority`     | `45`                                                                     |
| `max_attempts` | `2`                                                                      |
| `requirements` | `{"capability": "chat.json", "models": ["<the worker's pinned model>"]}` |
| `input`        | `{"messages": [{"role": "user", "content": <prompt>}], "schema": {...}}` |
| key            | `synthesis-select:<sha256>` then `synthesis-write:<sha256>`              |

The model is `CLIPS_WORKER_MODEL`, else the single model `worker/config.json`
pins, the same resolution triage uses. Nothing else is new in the job shape: it
is the shape `clips.triage` already sends, on another queue.

1. **select** - the clip and the wiki index; the answer names at most two
   existing pages the clip belongs in. Schema:
   `{pages: string[] (max 2), needs_claude: boolean, reason: string}`.
2. **write** - the clip, those pages whole and every page path; the answer is
   the complete text of each page written. Schema:
   `{pages: [{path, content}] (max 3), needs_claude: boolean, reason: string}`.

The model gets no tools. The engine writes the returned pages into the ingest
worktree itself, refusing any path outside the configured page directories, a
path that is not a normalised relative `.md` path, and any existing page the
model was not shown; then the hard validator runs as it does for every
transport.

## What the engine needs back

- The ordinary v1 result row, with `output.json` (or `output.text` holding the
  JSON) matching the job's schema.
- **`executor.provider` and `executor.model` on every output row.** The page's
  author is recorded as `worker:<provider>/<model>` from that field, and the
  author/verifier guard reads the provider back: `ollama` and `local-cpu` are
  the `local` grade tier, `codex`, `cursor` and `agy` their own tiers. A row
  without an executor is recorded as `worker:unreported`, which refuses every
  grade tier.
- `models.<model>.num_ctx` in `worker/config.json`. The engine reads it to
  refuse a prompt the window cannot hold (at three bytes a token, with room for
  the answer) before submitting; without it nothing is refused up front.

## What the worker has to add

The queue does not exist yet. Measured 2026-09-30 against the live coordinator:
`POST /v1/jobs` on `clips.synthesis` answers `403 queue_not_granted`. The
instance configuration needs, in `worker/config.json`:

```json
"queues": {
  "clips.synthesis": { "run_when": "active_ok", "max_outstanding": 20 }
},
"producers": {
  "clips": ["clips.triage", "clips.refine", "clips.grade", "clips.synthesis"]
}
```

No profile: it is inference, not a task, so the pinned local model serves it.
`active_ok` matches `clips.triage`; `idle` is the alternative if a 35B model
writing pages while the owner works costs too much.

## Measured

The same two-pass synthesis, submitted on `clips.triage` (a queue the `clips`
producer is already granted, used only for the measurement) against a throwaway
copy of the wiki's pages - never the wiki repository - on qwen3.6:35b at 40,960
tokens, one 15 KB clip, three runs on 2026-09-30:

| Run | Select | Write | Outcome                                                         |
| --- | ------ | ----- | --------------------------------------------------------------- |
| 1   | 65 s   | 369 s | new page written, refused by the validator: nothing links to it |
| 2   | 51 s   | 130 s | refused by the engine: rewrote a page it was never shown        |
| 3   | 28 s   | 65 s  | new page written, refused by the validator: nothing links to it |

Every refusal routed the clip with nothing published, which is the gate working.
The pages' prose was clean and attributed; the linking rule is what the local
model does not follow yet, and the open item in `TODO.md` is the next step.

A note for any client of the local Ollama server, which is why the worker, and
not an agent CLI, is the route: a request that does not pin `num_ctx` makes
Ollama 0.34 size the runner to the model's full 262,144-token context. Measured
2026-09-30: one `/v1/chat/completions` call reloaded the 22 GB model at 262,144
(25 s), and the next Vexa request reloaded it back at 40,960 (15 s). The
OpenAI-compatible endpoint has no way to pin `num_ctx`, so a CLI that speaks it
(opencode, pi) thrashes the model against every other client. The worker sends
the pinned `num_ctx` on every job.
