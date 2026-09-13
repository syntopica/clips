/** Apollo's normalized cache keys types by name, so the signed-in user appears
 * as `"User:<id>"`. Verified 2026-07-29 against `medium.com/me/lists`, whose
 * whole Apollo blob is that one User entry plus a Membership. */
export const VIEWER_ID_PATTERN = /"User:([\da-f]+)"/
