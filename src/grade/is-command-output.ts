/** Did the command produce stdout, or did it throw?
 *
 * `runCommand` rejects on a non-zero exit and the rejection is typed `unknown`,
 * so the success shape has to be narrowed rather than asserted. A guard rather
 * than a cast, because the failure object carries `stdout` too on some paths
 * and a cast would read it as a success. */
export const isCommandOutput = (value: unknown): value is { stdout: string } =>
  typeof value === 'object' &&
  value !== null &&
  'stdout' in value &&
  typeof value.stdout === 'string' &&
  !('code' in value)
