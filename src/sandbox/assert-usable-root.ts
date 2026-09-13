/**
 * Rejects a root that cannot be interpolated into a quoted s-expression. A
 * quote inside one would end the string and change the policy, so this is a
 * hard rejection rather than an escape.
 */
export const assertUsableRoot = (root: string): void => {
  if (root.includes('"')) {
    throw new Error(
      `root contains a quote and cannot be quoted safely: ${root}`,
    )
  }
  if (!root.startsWith('/')) throw new Error(`root must be absolute: ${root}`)
}
