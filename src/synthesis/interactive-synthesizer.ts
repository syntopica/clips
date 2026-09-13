import { askLine } from '../review/ask-line.ts'
import { INTERACTIVE_IDENTITY } from './interactive-identity.ts'
import { SYNTHESIS_INSTRUCTIONS } from './synthesis-instructions.ts'
import type { Synthesizer } from './synthesizer.ts'

/** The codex-disabled synthesizer (boundary decision: CODEX_DISABLED): opens
 * nothing itself - the pipeline has already created the worktree - and waits
 * for a human or a Claude session to write the pages there. `pagesTouched` is
 * left empty deliberately: for this synthesizer the validated diff is the
 * source of truth, and inventing a page list here would only create a way for
 * the two to disagree. */
export const interactiveSynthesizer: Synthesizer = {
  synthesize: async ({ clipDirectory, worktree, guidance }) => {
    process.stdout.write(
      `\nclip:     ${clipDirectory}\nworktree: ${worktree}\n\n${SYNTHESIS_INSTRUCTIONS}\n\n${
        guidance === '' ? '' : `${guidance}\n\n`
      }`,
    )
    for (;;) {
      const answer = await askLine('[d]one writing  [c]laude  [s]kip > ')
      if (answer === 'd') {
        return {
          pagesTouched: [],
          needsClaude: false,
          skipped: false,
          reason: 'human synthesis',
          identity: INTERACTIVE_IDENTITY,
        }
      }
      if (answer === 'c') {
        return {
          pagesTouched: [],
          needsClaude: true,
          skipped: false,
          reason: 'operator routed the clip to needs-claude',
          identity: INTERACTIVE_IDENTITY,
        }
      }
      if (answer === 's') {
        return {
          pagesTouched: [],
          needsClaude: false,
          skipped: true,
          reason: 'operator skipped the clip',
          identity: INTERACTIVE_IDENTITY,
        }
      }
    }
  },
}
