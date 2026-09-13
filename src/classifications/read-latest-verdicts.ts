import { join } from 'node:path'
import { readFileIfPresent } from '../clips/read-file-if-present.ts'
import { addVerdictRows } from './add-verdict-rows.ts'
import type { ClassificationVerdict } from './classification-verdict.ts'
import { classificationsDirectory } from './classifications-directory.ts'
import { runVerdictFiles } from './run-verdict-files.ts'

/** The `latest` view of `tools/capture/classifications.py`, in TypeScript: one
 * verdict per capture, the newest run winning.
 *
 * Keyed by both `normalized_url` and `capture_id` when a row carries them, so a
 * caller can look a clip up by either. An absent, empty or unparseable store
 * yields an empty map: a missing verdict means "not classified", never
 * "rejected" - see `latestVerdictForClip`. */
export const readLatestVerdicts = async (
  clipsRepository: string,
): Promise<Map<string, ClassificationVerdict>> => {
  const root = classificationsDirectory(clipsRepository)
  const verdicts = new Map<string, ClassificationVerdict>()
  for (const run of await runVerdictFiles(root)) {
    const raw = await readFileIfPresent(join(root, run))
    if (raw === null) continue
    addVerdictRows(verdicts, raw, run)
  }
  return verdicts
}
