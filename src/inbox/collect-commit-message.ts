/** The archive's commit for one hand-over; conventional like every instance
 * commit, kept beside the inbox code because only `clips pull` writes it. */
export const collectCommitMessage = (count: number): string =>
  `chore(clips): collect ${String(count)} clips from the inbox`
