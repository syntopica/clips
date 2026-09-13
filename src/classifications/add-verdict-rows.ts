import { parseJson } from '../clips/parse-json.ts'
import type { ClassificationVerdict } from './classification-verdict.ts'
import { isVerdictRow } from './is-verdict-row.ts'

/** Fold one run's JSONL into the verdict map, later runs overwriting earlier
 * ones because `readLatestVerdicts` visits them in order. A row is keyed by
 * both `normalized_url` and `capture_id` when it carries them; a line that is
 * not a verdict row is skipped rather than failing the run. */
export const addVerdictRows = (
  verdicts: Map<string, ClassificationVerdict>,
  raw: Buffer,
  run: string,
): void => {
  for (const line of raw.toString('utf8').split('\n')) {
    const row = parseJson(Buffer.from(line))
    if (!isVerdictRow(row)) continue
    for (const key of [row.normalized_url, row.capture_id])
      if (typeof key === 'string' && key !== '')
        verdicts.set(key, { bucket: row.bucket, run })
  }
}
