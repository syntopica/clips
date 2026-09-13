/** How a drain run ended, one counter per outcome kind plus the captures that
 * threw and therefore stay in the inbox. */
export type DrainCounts = {
  clipped: number
  alreadyClipped: number
  withoutBody: number
  failed: number
}
