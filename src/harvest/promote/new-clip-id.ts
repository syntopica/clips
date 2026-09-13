import { randomBytes } from 'node:crypto'
import { CROCKFORD_ALPHABET } from './crockford-alphabet.ts'

/** A ULID: 10 characters of millisecond timestamp then 16 of randomness, all
 * Crockford base32, matching `ULID_PATTERN` so `ledgerPath` accepts it.
 *
 * Written out rather than taken from the `ulid` package because this package
 * has exactly one runtime dependency and adding a second for 20 lines of base32
 * is a poor trade. The timestamp prefix is what makes clip ids sort by capture
 * time, so it is generated from the clock rather than being random throughout. */
export const newClipId = (now: Date): string => {
  let timestamp = now.getTime()
  const characters: string[] = []
  for (let index = 0; index < 10; index += 1) {
    characters.unshift(CROCKFORD_ALPHABET[timestamp % 32] ?? '0')
    timestamp = Math.floor(timestamp / 32)
  }
  for (const byte of randomBytes(16)) {
    characters.push(CROCKFORD_ALPHABET[byte % 32] ?? '0')
  }
  return characters.join('')
}
