import { readFileIfPresent } from '../clips/read-file-if-present.ts'
import { sensitiveDomainsPath } from './sensitive-domains-path.ts'

/** One hostname per line, `#` comments (SPEC:326-329). An absent file is an
 * empty list, not an error: the spec never says what absence means (recorded
 * in TODO for plan 2b), and the safe reading is that the operator has not
 * curated any sensitive domains yet - the manual review gate, not this list,
 * is what makes the phase safe (SPEC:330). */
export const readSensitiveDomains = async (
  brainRepository: string,
): Promise<string[]> => {
  const raw = await readFileIfPresent(sensitiveDomainsPath(brainRepository))
  if (raw === null) return []
  return raw
    .toString('utf8')
    .split('\n')
    .map((line) => line.trim().toLowerCase())
    .filter((line) => line !== '' && !line.startsWith('#'))
}
