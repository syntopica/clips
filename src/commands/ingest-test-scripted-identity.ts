/** A distinct identity, so a ledger written from this fixture can be told apart
 * from the interactive transport's - which is what every ledger recorded,
 * whatever wrote the page, until 2026-08-03. */
export const SCRIPTED_IDENTITY = {
  model: 'scripted-model',
  promptSha256: 'c'.repeat(64),
  boundary: 'scripted-boundary',
}
