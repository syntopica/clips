import { JSON_PARSE_FAILED } from './json-parse-failed.ts'

/** JSON_PARSE_FAILED rather than a throw, because a corrupt file is one
 * unreadable clip and must not take the whole walk down with it. */
export const parseJson = (bytes: Buffer): unknown => {
  try {
    return JSON.parse(bytes.toString('utf8'))
  } catch {
    return JSON_PARSE_FAILED
  }
}
