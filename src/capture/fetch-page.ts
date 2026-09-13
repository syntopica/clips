import { runCommand } from '../harvest/run-command.ts'
import { pageRequestHeaders } from './page-request-headers.ts'
import { PAGE_TRANSPORT_PATH } from './page-transport-path.ts'

/** GET one page as HTML, through Python's TLS stack.
 *
 * See `page_transport.py` for why the request cannot usefully be made from
 * Node: measured on 2026-08-04, the same User-Agent got 403 from medium.com and
 * elpais.com through `fetch` and 200 from both through this. */
export const fetchPage = async (url: string): Promise<string> => {
  const { stdout } = await runCommand('python3', [PAGE_TRANSPORT_PATH, url], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    env: {
      ...process.env,
      PAGE_HEADERS: JSON.stringify(pageRequestHeaders(url)),
    },
  })
  return stdout
}
