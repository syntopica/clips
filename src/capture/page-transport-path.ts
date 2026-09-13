import { fileURLToPath } from 'node:url'

/** Resolved from this module's own URL so it holds wherever the package is
 * checked out, rather than from the working directory. */
export const PAGE_TRANSPORT_PATH = fileURLToPath(
  new URL('./page_transport.py', import.meta.url),
)
