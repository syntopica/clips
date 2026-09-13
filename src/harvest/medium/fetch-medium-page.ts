import { runCommand } from '../run-command.ts'
import { mediumCookieHeader } from './medium-cookie-header.ts'
import { MEDIUM_TRANSPORT_PATH } from './medium-transport-path.ts'
import { MEDIUM_USER_AGENT } from './medium-user-agent.ts'

/** GET a Medium page with the session cookies attached.
 *
 * With a paid membership this returns the complete member-only article body -
 * verified 2026-07-29 on an article an anonymous fetch truncated at the
 * paywall. That difference is the entire reason this lane reuses Chrome's
 * session instead of fetching anonymously. See `medium_transport.py` for why
 * the request cannot be made from Node. */
export const fetchMediumPage = async (
  url: string,
  cookies: Map<string, string>,
): Promise<string> => {
  const { stdout } = await runCommand(
    'python3',
    [MEDIUM_TRANSPORT_PATH, 'get', url],
    {
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
      env: {
        ...process.env,
        MEDIUM_HEADERS: JSON.stringify({
          Cookie: mediumCookieHeader(cookies),
          'User-Agent': MEDIUM_USER_AGENT,
          'Accept-Encoding': 'gzip',
        }),
      },
    },
  )
  return stdout
}
