/** The `code` a failed spawn carries (`ETIMEDOUT`, `EAGAIN`, `ENOBUFS`), or
 * `unknown` when the error has none. */
export const spawnErrorCode = (error: Error): string => {
  const code: unknown = Reflect.get(error, 'code')
  return typeof code === 'string' ? code : 'unknown'
}
