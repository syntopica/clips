/** The `YYYY-MM-DD` a harvest run files its output under. Taken as a parameter
 * everywhere downstream so tests are not clock-dependent; this is the only
 * place that reads the real clock. */
export const harvestDate = (now: Date): string => now.toISOString().slice(0, 10)
