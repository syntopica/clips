/** Phrases a grader uses when it never saw the page's claims, matched against
 * its summary. Deliberately adjacency-tight: each pattern names the grader's
 * *input* being absent (a truncated prompt, no task, nothing provided), never
 * its *findings* being absent — "no unsupported claims" is what a real clean
 * pass says, and matching it would turn every honest verdict into `not graded`,
 * the always-fires failure that killed the hand-edited check.
 *
 * Seeded from the two summaries measured on 2026-08-08: "the prompt was
 * truncated before any specific claims were provided" and "no task to
 * complete". */
export const NO_CLAIMS_SIGNALS: readonly RegExp[] = [
  /truncat/i,
  /no task/i,
  /no (specific )?claims? (were |was )?(provided|given|supplied|presented)/i,
  /nothing to (grade|verify|evaluate|check|assess|complete)/i,
  /(prompt|evidence|input) (is|was|appears|seems) (empty|missing|incomplete)/i,
]
