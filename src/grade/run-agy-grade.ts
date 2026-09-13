import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runCommand } from '../harvest/run-command.ts'
import { unwrapAgyResponse } from '../harvest/triage/unwrap-agy-response.ts'
import { AGY_EVIDENCE_CEILING_BYTES } from './agy-evidence-ceiling-bytes.ts'
import { agyFailureTail } from './agy-failure-tail.ts'
import { agyFileGradeArgs } from './agy-file-grade-args.ts'
import { agyGradeArgs } from './agy-grade-args.ts'
import { EVIDENCE_BYTE_BUDGET } from './evidence-byte-budget.ts'
import { evidenceBytes } from './evidence-bytes.ts'
import { GRADE_OUTPUT_SCHEMA } from './grade-output-schema.ts'
import { gradePrompt } from './grade-prompt.ts'
import type { GradeRunner } from './grade-runner.ts'
import { gradeTimeoutMs } from './grade-timeout-ms.ts'
import { inlineGradePrompt } from './inline-grade-prompt.ts'
import { isCommandOutput } from './is-command-output.ts'
import { pageClaimsText } from './page-claims-text.ts'
import { readInlineSources } from './read-inline-sources.ts'
import { withoutFrontmatter } from './without-frontmatter.ts'

/** The Antigravity CLI as a grading transport, parameterised by model so the
 * same runner serves both tiers, so an empty codex workspace no
 * longer stops the pass that checks the wiki. Added 2026-08-02, the evening
 * codex ran out of credits for the second time in one day.
 *
 * Below the argv ceiling everything is inlined: this runner reads the page and
 * every source itself and hands over text, using `inlineGradePrompt` rather
 * than the path-passing `gradePrompt`. The old absolute ("agy skims or never
 * finds a file") was measured with relative paths and no permission to read;
 * it does not survive absolute paths plus `--dangerously-skip-permissions`,
 * and the inline route stays the default anyway because it needs none of that.
 *
 * Above the ceiling the run used to be refused with the numbers attached. Now
 * it switches to the file-handoff variant instead - the path-passing
 * `gradePrompt` codex already uses, with `agyFileGradeArgs` carrying the flag
 * set that measurement validated (see that file for the operator decision and
 * the injection risk it accepts). The runner therefore advertises
 * `EVIDENCE_BYTE_BUDGET` as its ceiling: past 2 MB the clock is the binding
 * limit on every transport, and the pre-flight refusal is still the honest
 * answer there.
 *
 * It is the better grader on independence, not merely the available one: the
 * synthesizer is codex, and a grader on a different vendor's model is further
 * from being its own verifier than a second codex run is. That argument
 * reverses the day synthesis moves to agy, and this comment is where to notice.
 *
 * The inline variant carries **no `--dangerously-skip-permissions`**, and
 * that omission is still the point where it applies: inlined captured text is
 * the ideal carrier for a prompt-injection payload, this repository holds live
 * credentials, and an inline grader needs no tools at all - everything it may
 * consider is already in the prompt. Its `--sandbox`, `--mode plan` and
 * `--disable-slash-commands` cost nothing there, and a blocked tool request
 * ends as a named timeout and a page reported `not graded`, never `clean`.
 * The file-handoff variant trades exactly that guarantee for the ability to
 * read at all, above the size where inlining is impossible - the trade and its
 * authorisation live in `agyFileGradeArgs`.
 *
 * Neither makes agy as confined as the codex runner, which has `-s read-only`
 * and no network. It makes the gap small enough to accept for a transport that
 * keeps working when the codex credits do not.
 *
 * A non-zero exit or an unreadable envelope returns a null message, which the
 * caller reports as a page that could not be graded - never as a clean one. */
export const agyGradeRunner = (model: string): GradeRunner => ({
  evidenceCeilingBytes: EVIDENCE_BYTE_BUDGET,
  run: async (root, pagePath, evidencePaths) => {
    const pageText = await readFile(pagePath, 'utf8').catch(() => null)
    if (pageText === null)
      return { exitCode: 1, lastMessage: null, stderrTail: 'page not readable' }
    const scratch = await mkdtemp(join(tmpdir(), 'agy-grade-'))
    const schemaPath = join(scratch, 'output-schema.json')
    await writeFile(schemaPath, JSON.stringify(GRADE_OUTPUT_SCHEMA))
    const bytes = await evidenceBytes(evidencePaths)
    const timeout = gradeTimeoutMs(bytes) * 2
    const args =
      bytes > AGY_EVIDENCE_CEILING_BYTES
        ? agyFileGradeArgs(
            gradePrompt(pagePath, evidencePaths),
            model,
            schemaPath,
            timeout / 60_000,
          )
        : agyGradeArgs(
            inlineGradePrompt(
              pageClaimsText(withoutFrontmatter(pageText)),
              await readInlineSources(root, evidencePaths),
            ),
            model,
            schemaPath,
            timeout / 60_000,
          )
    const result = await runCommand('agy', args, {
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
      timeout,
      killSignal: 'SIGKILL',
    }).catch((error: unknown) => error)
    if (!isCommandOutput(result))
      return {
        exitCode: 1,
        lastMessage: null,
        stderrTail: agyFailureTail(result),
      }
    return {
      exitCode: 0,
      lastMessage: unwrapAgyResponse(result.stdout),
      stderrTail: '',
    }
  },
})
