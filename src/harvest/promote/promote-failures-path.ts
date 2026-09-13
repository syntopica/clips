import { join } from 'node:path'

/** `promote-failures.json` sits inside the dated triage run, beside the topic
 * files whose ticks it is about.
 *
 * The run directory is the right home rather than the clip store: a failure is
 * the absence of a clip, so there is no clip directory to hang it on, and the
 * ticks it refers to live here. `inbox/` is gitignored, which matches - the
 * record is as durable as the ticks it annotates, and neither belongs in the
 * wiki's history. */
export const promoteFailuresPath = (runDirectory: string): string =>
  join(runDirectory, 'promote-failures.json')
