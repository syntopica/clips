import type { Clip } from '../clips/clip.ts'
import { HARVEST_CLIP_SOURCE } from '../harvest/promote/harvest-clip-source.ts'

/** Whether this capture exists because the owner ticked it.
 *
 * `clips-harvest` is the tick, today exactly: `readTickedArticles` is the only
 * thing that promotes into that source, and `parseTickedArticles` reads a tick
 * wherever it was made - inside `Rejected` included, which is the documented
 * way to overrule the classifier. Nothing else in a clip records the tick, so
 * the source is the signal until one does.
 *
 * That equivalence is the thing to watch. The capture-first design ends with
 * promotion capturing articles nobody ticked, and on the day it does this
 * function starts calling them owner statements. Whoever writes that change
 * either stops reporting `clips-harvest` for an unticked capture or records the
 * tick in the clip, and updates this file rather than leaving it true by
 * accident. */
export const isOwnerTickedCapture = (clip: Clip): boolean =>
  clip.metadata.clipped_from === HARVEST_CLIP_SOURCE
