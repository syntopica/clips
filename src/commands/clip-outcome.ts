/** What one clip's pass through the pipeline produced; `quit` additionally
 * ends the whole run cleanly, and `exhausted` ends it because the synthesis
 * transport is out of capacity, leaving the clip pending. */
export type ClipOutcome =
  | 'published'
  | 'skipped'
  | 'needs-claude'
  | 'reconciled'
  | 'stopped'
  | 'quit'
  | 'exhausted'
