import { join } from 'node:path'
import { JSON_PARSE_FAILED } from './json-parse-failed.ts'
import { parseJson } from './parse-json.ts'
import { readFileIfPresent } from './read-file-if-present.ts'

/** Reads and parses one JSON file inside a clip directory. Never throws: a
 * missing file or malformed JSON comes back as `{ ok: false, reason }` so the
 * caller can report a ThinClip instead of losing the whole walk. */
export const readJsonFile = async (
  directory: string,
  fileName: string,
): Promise<{ ok: true; value: unknown } | { ok: false; reason: string }> => {
  const raw = await readFileIfPresent(join(directory, fileName))
  if (raw === null) return { ok: false, reason: `no ${fileName}` }
  const parsed = parseJson(raw)
  if (parsed === JSON_PARSE_FAILED)
    return { ok: false, reason: `${fileName} is not valid JSON` }
  return { ok: true, value: parsed }
}
