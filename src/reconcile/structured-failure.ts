import { stripControlCharacters } from '../clips/strip-control-characters.ts'
import { STRUCTURED_FAILURE_PREFIX } from './structured-failure-prefix.ts'

/** SPEC:456-469: serialized into ClipStateSchema's `failure: string | null`
 * behind a prefix that separates it from legacy free text. Compact JSON,
 * message capped, control characters stripped. */
export const structuredFailure = (
  stage: string,
  code: string,
  message: string,
  retryable: boolean,
): string =>
  `${STRUCTURED_FAILURE_PREFIX}${JSON.stringify({
    version: 1,
    stage,
    code,
    message: stripControlCharacters(message).slice(0, 1000),
    retryable,
    occurredAt: new Date().toISOString(),
  })}`
