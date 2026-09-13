import type { ClipMetadata } from '../clips/clip-metadata.ts'
import { matchesSensitiveDomain } from './matches-sensitive-domain.ts'
import type { RouteDecision } from './route-decision.ts'
import { SENSITIVE_TAGS } from './sensitive-tags.ts'

/** Deterministic, before any model runs; a model may raise a clip to
 * needs-claude, never lower it (SPEC:312-330). Three of the four rules are
 * inert while phase 1 hardcodes sensitivity: 'public' and tags: [] - they are
 * implemented anyway so they start working the day the extension emits real
 * values, with no CLI change. */
export const routeClip = (
  metadata: ClipMetadata,
  sensitiveDomains: string[],
): RouteDecision => {
  if (metadata.sensitivity === 'restricted') {
    return {
      route: 'manual-only',
      reason: 'sensitivity is restricted; never handed to a synthesizer',
    }
  }
  if (metadata.sensitivity === 'private')
    return { route: 'needs-claude', reason: 'sensitivity is private' }
  const domain = matchesSensitiveDomain(metadata.site, sensitiveDomains)
  if (domain !== null)
    return { route: 'needs-claude', reason: `site matches ${domain}` }
  const tag = metadata.tags.find((entry) =>
    SENSITIVE_TAGS.has(entry.toLowerCase()),
  )
  if (tag !== undefined)
    return { route: 'needs-claude', reason: `tag ${tag} is sensitive` }
  return { route: 'synthesis-candidate', reason: 'public, no sensitive match' }
}
