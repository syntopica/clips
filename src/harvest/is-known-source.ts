import { HARVEST_SOURCES } from './harvest-sources.ts'

/** Whether `--source` names a collector this build has. Absent is valid and
 * means both. */
export const isKnownSource = (source: string | null): boolean =>
  source === null || HARVEST_SOURCES.includes(source)
