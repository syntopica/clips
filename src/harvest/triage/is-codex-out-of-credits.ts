import { CODEX_CREDIT_WALL_PATTERN } from './codex-credit-wall-pattern.ts'

/** Whether codex refused because the workspace is out of credits.
 *
 * Both streams are checked because codex has printed this on stdout as well as
 * stderr, and it does not always exit non-zero when it does.
 *
 * stdout also carries codex's echo of the prompt, so this reads attacker-
 * influenced text by construction - see the pattern for why it matches the
 * whole sentence rather than a phrase. */
export const isCodexOutOfCredits = (stdout: string, stderr: string): boolean =>
  CODEX_CREDIT_WALL_PATTERN.test(stdout) ||
  CODEX_CREDIT_WALL_PATTERN.test(stderr)
