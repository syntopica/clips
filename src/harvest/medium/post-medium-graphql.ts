import { runCommand } from '../run-command.ts'
import { MEDIUM_GRAPHQL_URL } from './medium-graphql-url.ts'
import { MEDIUM_TRANSPORT_PATH } from './medium-transport-path.ts'

/** The real GraphQL transport, matching the `post` seam
 * `FetchReadingListInput` declares so tests can substitute a canned sequence.
 * Routed through Python for the Cloudflare reason documented in
 * `medium_transport.py`. */
export const postMediumGraphql = async (
  body: string,
  headers: Record<string, string>,
): Promise<unknown> => {
  const pending = runCommand(
    'python3',
    [MEDIUM_TRANSPORT_PATH, 'post', MEDIUM_GRAPHQL_URL],
    {
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
      env: {
        ...process.env,
        MEDIUM_HEADERS: JSON.stringify({
          ...headers,
          'Accept-Encoding': 'gzip',
        }),
      },
    },
  )
  pending.child.stdin?.end(body)
  const { stdout } = await pending
  return JSON.parse(stdout)
}
