import { parseJson } from '../../clips/parse-json.ts'
import { readFileIfPresent } from '../../clips/read-file-if-present.ts'
import type { PromoteFailure } from './promote-failure.ts'
import { promoteFailuresPath } from './promote-failures-path.ts'
import { PromoteFailuresSchema } from './promote-failures-schema.ts'

/** Every ticked article this run has failed to fetch so far, first-failed
 * first.
 *
 * Absent, empty and unparseable all read as no history: a run where every fetch
 * landed is the common case and has no file at all, so a throw here would make
 * the normal path the exceptional one. */
export const readPromoteFailures = async (
  runDirectory: string,
): Promise<PromoteFailure[]> => {
  const raw = await readFileIfPresent(promoteFailuresPath(runDirectory))
  if (raw === null) return []
  const parsed = PromoteFailuresSchema.safeParse(parseJson(raw))
  return parsed.success ? parsed.data : []
}
