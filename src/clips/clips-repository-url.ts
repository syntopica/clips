import { currentSyntopicaConfig } from '../config/current-syntopica-config.ts'

export function clipsRepositoryUrl(): string {
  const url = currentSyntopicaConfig().repositoryUrl
  if (url === null)
    throw new Error('Configure clips.repositoryUrl before cloning the archive')
  return url
}
