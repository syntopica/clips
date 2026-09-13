/** What draining one capture produced.
 *
 * `no-body` is a success, not a failure: the capture left the inbox and a clip
 * kept its URL. It is reported separately because a run where every page was
 * unreadable is worth noticing, even though nothing went wrong mechanically. */
export type DrainOutcome = {
  kind: 'clipped' | 'already-clipped' | 'no-body'
  reason: string | null
}
