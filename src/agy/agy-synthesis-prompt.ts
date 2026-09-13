import { agySynthesisTaskInstructions } from './agy-synthesis-task-instructions.ts'
import { agySynthesisUntrustedPageIntro } from './agy-synthesis-untrusted-page-intro.ts'

/** The synthesis prompt for agy, which differs from the codex one in two ways
 * that were measured rather than assumed (2026-08-02).
 *
 * **The clip text is inlined, not passed as a path.** Told to read a file, agy
 * either skims it or spends minutes searching the filesystem - the same finding
 * that shaped the grade and triage runners.
 *
 * **Every path it must write is absolute.** A probe asking for `probe.md` "in
 * the current working directory" wrote it into
 * `~/.gemini/antigravity-cli/scratch/` instead: agy has no working-directory
 * flag and its idea of the cwd is its own scratch, whatever the shell's is. The
 * same probe with an absolute path plus `--add-dir` landed the file exactly
 * where asked. So the worktree is named in full, every time, and the
 * instruction to use absolute paths is explicit.
 *
 * Data first and instructions last, per Gemini's own prompting guidance, which
 * the Anthropic models on this transport tolerate fine.
 *
 * `guidance` carries why earlier drafts of this clip were rejected, and is the
 * empty string for a clip that has never been refused - which is almost all of
 * them, and which must leave the prompt bytes exactly as they were, because
 * `promptSha256` records them. Instructions last is also why it goes at the
 * end: it is the most specific thing said about this clip.
 *
 * Assembled from two halves - agySynthesisUntrustedPageIntro and
 * agySynthesisTaskInstructions - split only to keep each function under the
 * line limit; concatenated they are exactly this prompt. */
export const agySynthesisPrompt = (
  clipText: string,
  worktree: string,
  guidance: string,
): string =>
  `${agySynthesisUntrustedPageIntro(clipText, worktree)}${agySynthesisTaskInstructions(worktree, guidance)}`
