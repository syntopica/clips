import { join } from 'node:path'

export const sensitiveDomainsPath = (brainRepository: string): string =>
  join(brainRepository, '.ingest', 'sensitive-domains.txt')
