import { currentSyntopicaConfig } from '../config/current-syntopica-config.ts'

export function inboxRepositoryUrl(): string {
  const url = currentSyntopicaConfig().inboxRepositoryUrl
  if (url === null)
    throw new Error(
      'Configure clips.inboxRepositoryUrl before cloning the inbox',
    )
  return url
}
