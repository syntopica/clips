/** What the ledger records as the author when Cursor wrote the page.
 *
 * The transport, not a model string, for the same reason `CODEX_IDENTITY_MODEL`
 * is: which model answered is the CLI's own configuration and a run here never
 * reads it back, so the ledger names the thing this process can actually
 * observe. Shared with the grade lane, which has to recognise this exact value
 * to know the cursor tier is the one a batch's author already used. */
export const CURSOR_IDENTITY_MODEL = 'cursor'
