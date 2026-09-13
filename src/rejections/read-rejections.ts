import { parseJson } from '../clips/parse-json.ts'
import { readFileIfPresent } from '../clips/read-file-if-present.ts'
import type { Rejection } from './rejection.ts'
import { rejectionsPath } from './rejections-path.ts'
import { RejectionsSchema } from './rejections-schema.ts'

/** Every draft this clip has had turned down, oldest first.
 *
 * Absent, empty and unparseable all read as no history. A clip that has never
 * been rejected is the common case and has no file at all, so a throw here
 * would make the normal path the exceptional one. */
export const readRejections = async (
  clipDirectory: string,
): Promise<Rejection[]> => {
  const raw = await readFileIfPresent(rejectionsPath(clipDirectory))
  if (raw === null) return []
  const parsed = RejectionsSchema.safeParse(parseJson(raw))
  return parsed.success ? parsed.data : []
}
