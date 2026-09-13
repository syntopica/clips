/** The file the access-time probe reads. Deliberately not a wiki page: it sits
 * outside the set `pageAtimes` measures, so probing can never show up as a read
 * the model made. It is present in every worktree because it is committed. */
export const READ_PROBE_PAGE = 'SCHEMA.md'
