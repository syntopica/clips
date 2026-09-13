/** One line of a run file, as far as this reader cares. The Python writer emits
 * more fields (topic, reason, model, prompt_sha256, classified_at); reading only
 * what is used here means a new field never breaks the reader. */
export type VerdictRow = {
  bucket: string
  normalized_url?: unknown
  capture_id?: unknown
}
