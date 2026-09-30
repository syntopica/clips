/** The file the access-time probe reads. Deliberately not a wiki page: it sits
 * outside the set `pageAtimes` measures, so probing can never show up as a read
 * the model made. It is present in every worktree because every instance
 * commits it at the repository root.
 *
 * It was `SCHEMA.md` until 2026-09-30. The schema left the owner's repository
 * root with the split of 2026-09-14, the probe found nothing to read, and every
 * run since would have recorded its reads as unobservable without saying why. */
export const READ_PROBE_PAGE = 'syntopica.config.json'
