import { join } from 'node:path'

export const clipRunsPath = (runsDirectory: string, clipId: string): string =>
  join(runsDirectory, `${clipId}.json`)
