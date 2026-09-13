/** One capture's current verdict, resolved across every classification run.
 * `run` is the run file it came from, so a skip can name the reason's source
 * rather than asserting it. `bucket` is left as a string on purpose: the store
 * is written by `tools/capture/classifications.py` and a bucket it grows later
 * must not make this reader throw. */
export type ClassificationVerdict = {
  bucket: string
  run: string
}
