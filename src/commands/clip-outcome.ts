/** What one clip's pass through the pipeline produced; `quit` additionally
 * ends the whole run cleanly. */
export type ClipOutcome =
  'published' | 'skipped' | 'needs-claude' | 'reconciled' | 'stopped' | 'quit'
