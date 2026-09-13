/** What the ledger records as the author when codex wrote the page.
 *
 * The transport, not a model string: the model is codex's own configuration and
 * this process never reads it, so the ledger names what it can actually
 * observe. Shared with the grade lane, which has to recognise this exact value
 * to know that the codex tier is the one a batch's author already used. */
export const CODEX_IDENTITY_MODEL = 'codex'
