/** Whether a run covers one collector. `--source` absent means both, which is
 * why the null case answers yes rather than no. */
export const wantsSource = (source: string | null, name: string): boolean =>
  source === null || source === name
