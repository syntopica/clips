/** A token count read from a transport's own output, or null when the field is
 * absent or not a finite number. */
export const finiteCountOrNull = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null
