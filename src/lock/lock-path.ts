import { join } from 'node:path'

export const lockPath = (brainRepository: string): string =>
  join(brainRepository, '.ingest', 'lock')
