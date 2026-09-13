/** Crockford base32: the digits, then the uppercase letters minus I, L, O and
 * U. Excluding those is the point of the encoding - they are the ones humans
 * misread as 1, 1, 0 and V. `ULID_PATTERN` in `src/clips/` is the same set
 * expressed as a character class. */
export const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
