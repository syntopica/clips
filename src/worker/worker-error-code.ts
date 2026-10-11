import type { WorkerErrorResponse } from './worker-error-response.ts'
/** The `error` code of a coordinator refusal body, or `unknown`.
 *
 * Contract v1 keeps these codes free of provider and generated text, which is
 * what makes them safe to put in an exception message. */
export const workerErrorCode = (text: string): string => {
  try {
    const code = (JSON.parse(text) as WorkerErrorResponse).error
    return typeof code === 'string' ? code : 'unknown'
  } catch {
    return 'unknown'
  }
}
