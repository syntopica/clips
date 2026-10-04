import { readFile } from 'node:fs/promises'
import { parseJson } from '../clips/parse-json.ts'
import type { ClipRun } from './clip-run.ts'
import { clipRunsPath } from './clip-runs-path.ts'
import { ClipRunsSchema } from './clip-runs-schema.ts'

/** A clip's recorded runs, oldest first. Absent, unreadable and malformed all
 * read as no history: every clip ingested before runs were recorded has none,
 * and a status report must not fail on one bad file. */
export const readClipRuns = async (
  runsDirectory: string,
  clipId: string,
): Promise<ClipRun[]> => {
  const raw = await readFile(clipRunsPath(runsDirectory, clipId)).catch(
    () => null,
  )
  if (raw === null) return []
  const parsed = ClipRunsSchema.safeParse(parseJson(raw))
  return parsed.success ? parsed.data : []
}
