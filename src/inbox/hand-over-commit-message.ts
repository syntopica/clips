/** The inbox's commit for the same hand-over, seen from the repository the
 * browser clipper writes to. */
export const handOverCommitMessage = (count: number): string =>
  `chore(inbox): hand ${String(count)} clips to the archive`
