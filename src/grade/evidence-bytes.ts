import { stat } from 'node:fs/promises'

/** Total bytes of the evidence a grading run would read. A path that cannot be
 * stat'd counts as nothing rather than raising: it is already the caller's
 * problem through the on-disk count, and a budget check must not be the thing
 * that fails a run. */
export const evidenceBytes = async (
  paths: readonly string[],
): Promise<number> => {
  let total = 0
  for (const path of paths) {
    const size = await stat(path)
      .then((stats) => stats.size)
      .catch(() => 0)
    total += size
  }
  return total
}
