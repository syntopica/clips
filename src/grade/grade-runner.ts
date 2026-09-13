import type { CodexRunResult } from '../codex/codex-run-result.ts'

/** The process boundary, injected so the grade lane's logic is testable without
 * spending any model quota.
 *
 * It takes paths rather than a finished prompt because the prompt is
 * transport-specific: codex is pointed at files and reads them under
 * `-s read-only`, while agy has to be handed their contents, in the opposite
 * order. Building the prompt inside the runner is what lets those two coexist
 * without either shape leaking into the caller. `root` is the directory the
 * names in the report are relative to. */
export type GradeRunner = {
  /** The most evidence this transport may be handed, in bytes. Per-transport
   * because the binding limit differs in kind: codex is given paths and reads
   * them itself, so its ceiling is the clock, while agy is given the text and
   * so its ceiling is the operating system's argv limit. One shared number hid
   * that until raising it produced `spawn E2BIG` on one transport and a longer,
   * working run on the other. */
  evidenceCeilingBytes: number
  run(
    root: string,
    pagePath: string,
    evidencePaths: readonly string[],
  ): Promise<CodexRunResult>
}
