/** Reconciled clips listed by `--items`, newest first. Every waiting clip is
 * listed; the done ones are the bulk of a store (about 2000 on the measured
 * one) and each costs a ledger read, so only the recent ones are. */
export const RECENT_RECONCILED_ITEMS = 50
