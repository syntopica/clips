import type { ValueFlagKey } from './value-flag-key.ts'

/** Flag spelling to the field the next argument lands in. */
export const VALUE_FLAGS: Record<string, ValueFlagKey> = {
  '--clip': 'clip',
  '--date': 'date',
  '--limit': 'limit',
  '--since': 'since',
  '--source': 'source',
}
