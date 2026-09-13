/** What one allowlisted sender contributed to a sweep. Kept per sender rather
 * than only in the totals because a sender whose mail arrives and yields
 * nothing is invisible in a total - it reads as coverage. */
export type SenderYield = {
  sender: string
  emailCount: number
  linkCount: number
}
