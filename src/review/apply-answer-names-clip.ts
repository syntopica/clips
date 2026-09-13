/** Whether an apply answer names the clip under review.
 *
 * The answer arrives lowercased and trimmed from `askLine`. The named id must
 * be a prefix of the clip's ULID and the full 26 characters are never required
 * - the gate's own prompt shows the prefix to type.
 *
 * **Sixteen characters, not six, and this said six until 2026-09-11.** A ULID
 * opens with 10 characters of timestamp, so clips harvested in the same
 * millisecond are identical for their first 10 and often further: of one batch
 * that day, `01KYSGC20Y00EZJSSSFXW0NTV3` and `01KYSGC20Y00GK8SEMAE6PS387`
 * share twelve. The six-character floor therefore did not do what its own
 * comment claimed - a stale answer left in the FIFO by a previous prompt
 * matched the next clip and applied a diff nobody had read. That is the exact
 * failure the naming rule exists to prevent, seen once in the wild before this
 * fix. Sixteen reaches six characters of ULID randomness, which no two clips
 * share.
 *
 * The floor is a bound on the damage, not a cure: an answer written before its
 * prompt existed is still read as an answer. What removes that is draining
 * whatever is already buffered before a gate prompts, tracked in `TODO.md`. */
export const applyAnswerNamesClip = (
  answer: string,
  clipId: string,
): boolean => {
  const match = /^a\s+(\S+)$/.exec(answer)
  const named = match?.[1]
  if (named === undefined || named.length < 16) return false
  return clipId.toLowerCase().startsWith(named)
}
