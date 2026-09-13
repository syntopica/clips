/** Known ledger schemaVersion values. Anything else is reported, never guessed
 * at: a ledger written by a newer CLI describes work this one cannot verify. */
export const SUPPORTED_LEDGER_VERSIONS: readonly number[] = [1]
