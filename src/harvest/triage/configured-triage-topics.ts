import { currentSyntopicaConfig } from '../../config/current-syntopica-config.ts'

/** The topics this instance files harvested articles under, read at call
 * time from `newsletter.triageTopics`, with `other` always last.
 *
 * `other` is the engine's, not the instance's: it absorbs everything that does
 * not fit, which is what keeps a configured list short instead of growing it
 * into a taxonomy of the internet. */
export function configuredTriageTopics(): readonly string[] {
  const configured = currentSyntopicaConfig().triageTopics
  return [...configured.filter((topic) => topic !== 'other'), 'other']
}
