/** Crockford base32, 26 characters, no I, L, O or U. This is the only untrusted
 * value that becomes a path: `ledgerPath` joins it into
 * .ingest/clips/<clip_id>.json, so `min(26)` accepted
 * `../../../../../etc/passwd0000000000` as a clip_id. Validated at the schema
 * boundary rather than at each join, so no future caller has to remember. */
export const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/
