import { fileURLToPath } from 'node:url'

/** Resolved from this module's own URL so it holds wherever the package is
 * checked out, rather than from the working directory. */
export const MEDIUM_TRANSPORT_PATH = fileURLToPath(
  new URL('./medium_transport.py', import.meta.url),
)
