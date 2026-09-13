/** The counts printed and checked after a grade batch: how many claims across
 * every graded page came back unsupported, uncheckable or attributed to the
 * wrong source, how many pages could not be graded at all, and how many were
 * exempt. */
export type GradeTotals = {
  unsupported: number
  uncheckable: number
  misattributed: number
  ungraded: number
  exempt: number
}
