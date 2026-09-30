import { expect, it } from 'vitest'
import { workerErrorCode } from './worker-error-code.ts'

it('reads the code and never echoes anything else the body carries', () => {
  expect(workerErrorCode('{"error": "idempotency_conflict"}')).toBe(
    'idempotency_conflict',
  )
  expect(workerErrorCode('{"error": {"nested": true}}')).toBe('unknown')
  expect(workerErrorCode('<html>proxy error</html>')).toBe('unknown')
})
