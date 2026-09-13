import { readFile } from 'node:fs/promises'
import { cursorJsonPayload } from '../cursor/cursor-json-payload.ts'
import { runCursorAgent } from '../cursor/run-cursor-agent.ts'
import { CURSOR_EVIDENCE_CEILING_BYTES } from './cursor-evidence-ceiling-bytes.ts'
import { cursorFailureTail } from './cursor-failure-tail.ts'
import { cursorGradeArgs } from './cursor-grade-args.ts'
import { CURSOR_SCHEMA_INSTRUCTION } from './cursor-schema-instruction.ts'
import { evidenceBytes } from './evidence-bytes.ts'
import type { GradeRunner } from './grade-runner.ts'
import { gradeTimeoutMs } from './grade-timeout-ms.ts'
import { inlineGradePrompt } from './inline-grade-prompt.ts'
import { pageClaimsText } from './page-claims-text.ts'
import { readInlineSources } from './read-inline-sources.ts'
import { unwrapCursorResponse } from './unwrap-cursor-response.ts'
import { withoutFrontmatter } from './without-frontmatter.ts'

/** The Cursor CLI as a grading transport, parameterised by model so one runner
 * serves whatever tier the account has left.
 *
 * It exists for independence rather than for capability. The author/verifier
 * split is the whole point of this pass, and by 2026-09-11 it had run out of
 * room: the 2026-08-24 batch was written by codex, so codex may not grade it;
 * `agy-bulk` fails on those pages with `grader exited 1` and a tail carrying
 * nothing; and `agy-fine` is the default synthesizer, so it is refused by
 * `fallbackGraderAfterCodex` on any batch it might have written. A fourth
 * account, on a model family that has never written a page here, is what turns
 * that from a blocked item back into a grading run.
 *
 * Everything is inlined, like the agy runner and unlike codex: the page and
 * every source are read here and handed over as text, down a pipe rather than
 * through argv. Moving to the pipe raised the size this transport survives and
 * did not remove the limit - see `CURSOR_EVIDENCE_CEILING_BYTES`, which is back
 * after a few hours of believing otherwise. The timeout is doubled the way the
 * agy runner doubles it, and for a sharper reason here: 480 KB on stdin was
 * measured at 465 seconds against a 600-second budget, so the undoubled clock
 * would kill runs the transport was going to finish.
 *
 * A non-zero exit, an `is_error` envelope, or an answer that is not the five
 * required keys all return a null message, which the caller reports as a page
 * that could not be graded - never as a clean one. */
export const cursorGradeRunner = (model: string): GradeRunner => ({
  evidenceCeilingBytes: CURSOR_EVIDENCE_CEILING_BYTES,
  run: async (root, pagePath, evidencePaths) => {
    const pageText = await readFile(pagePath, 'utf8').catch(() => null)
    if (pageText === null)
      return { exitCode: 1, lastMessage: null, stderrTail: 'page not readable' }
    const prompt =
      inlineGradePrompt(
        pageClaimsText(withoutFrontmatter(pageText)),
        await readInlineSources(root, evidencePaths),
      ) + CURSOR_SCHEMA_INSTRUCTION
    const timeout = gradeTimeoutMs(await evidenceBytes(evidencePaths)) * 2
    const result = await runCursorAgent(cursorGradeArgs(model), prompt, timeout)
    if (result.failed)
      return {
        exitCode: 1,
        lastMessage: null,
        stderrTail: cursorFailureTail(result),
      }
    // `--mode ask` has produced bare JSON every time so far, but the synthesis
    // lane proved on 2026-09-11 that this CLI will narrate before answering,
    // and a contract that holds only while the model stays disciplined is not
    // a contract. Costs one scan of a string already in memory.
    const answer = unwrapCursorResponse(result.stdout)
    const lastMessage = answer === null ? null : cursorJsonPayload(answer)
    // An envelope carrying no verdict is not self-explanatory, and the two
    // causes look identical from here: a refusal Cursor prints as `is_error`,
    // and a model that answered in prose despite the contract. Carrying the raw
    // tail is what lets the escalation say which - the lesson the agy grader's
    // over-filtered tail taught by costing a batch its diagnosis.
    return {
      exitCode: 0,
      lastMessage,
      stderrTail:
        lastMessage === null ? (answer ?? result.stdout).slice(-400) : '',
    }
  },
})
