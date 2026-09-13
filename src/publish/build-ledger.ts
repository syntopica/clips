import { TOOL_VERSION } from '../cli/tool-version.ts'
import { contentSha256 } from '../clips/content-sha256.ts'
import type { Ledger } from '../ledger/ledger.ts'
import type { BuildLedgerInput } from './build-ledger-input.ts'

/** The ledger for one published clip. The brain commit sha is deliberately
 * absent - the ledger is part of that very commit (SPEC:489-516).
 *
 * The synthesizer block is reported by the transport that ran, not assumed
 * here. It used to be hard-coded to `claude-in-the-loop` / `human-review` and
 * the hash of the interactive instructions, written before any unattended
 * transport existed; once codex and then agy started writing pages, every
 * ledger claimed a human-in-the-loop wrote them and named a prompt the model
 * never saw. With `synthesizeWithFallback` switching models mid-batch on the
 * quota wall, that was not even correctable after the fact.
 *
 * `pagesRead` is the other half of the same question and the one that stayed
 * open after that fix: `promptSha256` records what the synthesizer was handed,
 * and this records what it went and opened for itself, which for a transport
 * running inside a worktree of the whole wiki is most of what it saw. It is
 * observed rather than self-reported - see `finishReadObservation`. */
export const buildLedger = async (
  input: BuildLedgerInput,
): Promise<Ledger> => ({
  schemaVersion: 1,
  clipId: input.clip.metadata.clip_id,
  clipFormatVersion: input.clip.metadata.schema_version,
  contentSha256: await contentSha256(input.clip.directory),
  clipRepoCommit: input.clipRepoCommit,
  clipSourcePath: input.clipSourcePath,
  brainBaseCommit: input.brainBaseCommit,
  processedAt: new Date().toISOString(),
  reviewedAt: new Date().toISOString(),
  pagesTouched: input.pagesTouched,
  pagesRead: input.pagesRead,
  synthesizer: {
    model: input.identity.model,
    promptSha256: input.identity.promptSha256,
    toolVersion: TOOL_VERSION,
    boundary: input.identity.boundary,
  },
})
