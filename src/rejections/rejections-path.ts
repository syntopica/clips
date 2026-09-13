import { join } from 'node:path'

/** `rejections.json` sits beside `metadata.json` and `state.json` in the clip's
 * own directory, so it travels with the clip through every bucket move and is
 * pushed with it. The clip is where the history belongs: the next run finds it
 * by opening the same directory it already reads. */
export const rejectionsPath = (clipDirectory: string): string =>
  join(clipDirectory, 'rejections.json')
