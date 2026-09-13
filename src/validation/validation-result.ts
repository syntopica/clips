import type { ValidationFailure } from './validation-failure.ts'

/** `paths` is the exact validated set; the committer stages only these, never
 * `git add -A` (SPEC:344-360). */
export type ValidationResult =
  { ok: true; paths: string[] } | { ok: false; failure: ValidationFailure }
