/** One draft the reviewer turned down, and why.
 *
 * `reason` is the reviewer's own words, typed at the gate. It is the only part
 * of a rejection worth keeping: the diff it rejected is reproducible from the
 * clip, the judgement is not. */
export type Rejection = {
  at: string
  reason: string
}
