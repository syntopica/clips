import type { ValidationResult } from './validation-result.ts'

export const contentValidationFailure = (reason: string): ValidationResult => ({
  ok: false,
  failure: { code: 'CONTENT_VALIDATION_FAILED', reason },
})
