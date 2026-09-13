/** What codex prints when the workspace has no credits left:
 * `ERROR: Your workspace is out of credits. Ask your workspace owner to refill
 * in order to continue.`
 *
 * The whole sentence is matched, not the memorable half of it, because codex
 * echoes the prompt back on stdout - and the prompt is full of untrusted
 * article titles. A title reading "I ran out of credits in a week" must not
 * reach a transport switch, so the pattern demands the second clause too.
 *
 * Matched narrowly for a second reason. This is the one codex failure that no
 * retry and no amount of waiting will clear, so it is the only one worth
 * switching transport over - a timeout, a killed process or a malformed answer
 * must still degrade the batch to `review` rather than quietly changing which
 * model classified it. */
export const CODEX_CREDIT_WALL_PATTERN =
  /your workspace is out of credits\.\s*ask your workspace owner to refill/iu
