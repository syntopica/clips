/** The page directories a grading run may never transmit, and the reason is
 * older than this check.
 *
 * `README.md` and `SCHEMA.md` have said since the vault fold that the model
 * offload covers `sources/` and public material only, and that `personal/`,
 * `people/` and any `business/` page carrying figures or credentials are read
 * by Claude directly, never handed to a transport. That rule was prose and
 * nothing enforced it: `clips grade --page business/companies.md` would inline
 * that page's full text - eleven passwords, API keys and account numbers among
 * it - into a prompt and send it to whichever vendor the runner points at.
 *
 * Most such pages were shielded by accident rather than by design, because
 * `verification: exempt` returns before any model call. Ten were not, measured
 * 2026-09-11: eight under `business/` including the company credential table
 * and the forensic separation report, and two under `personal/`. The exemption
 * is a statement about what can verify a page, not about what may leave the
 * machine, and leaning on it for the second was luck.
 *
 * `topics/` and `projects/` are absent on purpose. They are written from
 * captured public articles, which is what the grader exists to check them
 * against, and the clips being sent with them came off the public web to begin
 * with. */
export const SENSITIVE_PAGE_DIRECTORIES: readonly string[] = [
  'business/',
  'personal/',
  'people/',
]
