import type { VerdictRow } from './verdict-row.ts'

/** A row is usable when it carries a string `bucket`. Anything else - a blank
 * line, a truncated write, a shape from a future writer - is skipped, because
 * one bad line must not take a whole run file's verdicts down with it. */
export const isVerdictRow = (row: unknown): row is VerdictRow =>
  typeof row === 'object' &&
  row !== null &&
  typeof (row as { bucket?: unknown }).bucket === 'string'
