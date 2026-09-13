/** SPEC:374-392. `skip` leaves the clip pending; `claude` routes it to
 * needs-claude with REVIEWER_ESCALATED; `quit` ends the run cleanly. */
export type ReviewVerdict = 'apply' | 'skip' | 'claude' | 'quit'
