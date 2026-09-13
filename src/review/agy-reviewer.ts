import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runCommand } from '../harvest/run-command.ts'
import { unwrapAgyResponse } from '../harvest/triage/unwrap-agy-response.ts'
import { agyReviewPrompt } from './agy-review-prompt.ts'
import { AGY_REVIEW_SCHEMA } from './agy-review-schema.ts'
import { diffNeedsHuman } from './diff-needs-human.ts'
import { readAgyVerdict } from './read-agy-verdict.ts'
import type { ReviewOutcome } from './review-outcome.ts'
import type { Reviewer } from './reviewer.ts'
import { sensitiveDiffRefusal } from './sensitive-diff-refusal.ts'

/** A review gate that reads the diff with a model instead of a person.
 *
 * Fail-closed at every step. `diffNeedsHuman` is checked first and cannot be
 * overridden by the model's answer; a transport failure, an exhausted quota, an
 * empty body or an unparseable envelope all escalate to `claude` rather than
 * approving, because the failure that matters here is a wrong `apply` reaching
 * the wiki and every other outcome costs one human review.
 *
 * `model` must not be the one that wrote the diff - `selectReviewer` enforces
 * that. Read-only flags throughout: this pass needs no tools, and the diff it
 * inlines is untrusted, so `--mode plan` makes an injected tool request block
 * rather than be auto-approved. */
export const agyReviewer = (model: string): Reviewer => ({
  automatic: true,
  review: async (input): Promise<ReviewOutcome> => {
    // The author is asked, never assumed. selectReviewer compares the
    // configured constants and cannot see a runtime fallback: when agy's Claude
    // quota emptied on 2026-08-08 synthesis continued on this very model, and a
    // gate marking its own work returns a verdict indistinguishable from a real
    // one. Escalating costs one human review; not escalating costs the meaning
    // of every verdict in the batch.
    if (input.authorModel === model)
      return {
        verdict: 'claude',
        reason: `the diff was written by ${model}, which is this gate's own model - no independent review is possible`,
      }
    const diff = await input.fullDiff()
    const sensitive = sensitiveDiffRefusal(diff)
    if (sensitive !== null) return { verdict: 'claude', reason: sensitive }
    const blocked = diffNeedsHuman(diff)
    if (blocked !== null) return { verdict: 'claude', reason: blocked }

    const scratch = await mkdtemp(join(tmpdir(), 'clips-review-agy-'))
    const schemaPath = join(scratch, 'review-schema.json')
    await writeFile(schemaPath, JSON.stringify(AGY_REVIEW_SCHEMA))
    const result = await runCommand(
      'agy',
      [
        '-p',
        agyReviewPrompt(diff),
        '--model',
        model,
        '--json-schema',
        schemaPath,
        '--output-format',
        'json',
        '--print-timeout',
        '20m',
        '--sandbox',
        '--mode',
        'plan',
      ],
      {
        encoding: 'utf8',
        maxBuffer: 8 * 1024 * 1024,
        timeout: 25 * 60 * 1000,
        killSignal: 'SIGKILL',
      },
    ).catch(() => null)
    return readAgyVerdict(
      result === null ? null : unwrapAgyResponse(result.stdout),
    )
  },
})
