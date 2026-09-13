import { describe, expect, it } from 'vitest'
import { unwrapCursorResponse } from './unwrap-cursor-response.ts'

const envelope = (fields: Record<string, unknown>): string =>
  JSON.stringify({
    type: 'result',
    subtype: 'success',
    is_error: false,
    ...fields,
  })

describe('unwrapCursorResponse', () => {
  it('returns the model text from the result field', () => {
    expect(
      unwrapCursorResponse(envelope({ result: '{"verdict":"clean"}' })),
    ).toBe('{"verdict":"clean"}')
  })

  it('refuses an envelope flagged is_error, even though it carries a result', () => {
    // The case the exit code cannot catch: cursor-agent exits 0 on a run that
    // failed mid-turn, and the result field then holds an apology. Reading it
    // as a verdict would report a transport failure as a graded page.
    expect(
      unwrapCursorResponse(
        JSON.stringify({
          is_error: true,
          result: 'I could not complete that.',
        }),
      ),
    ).toBeNull()
  })

  it('returns null for stdout that is not JSON at all', () => {
    // What `Workspace Trust Required` looks like from here.
    expect(unwrapCursorResponse('⚠ Workspace Trust Required')).toBeNull()
  })

  it('returns null when the envelope carries no result field', () => {
    expect(unwrapCursorResponse(envelope({ session_id: 'abc' }))).toBeNull()
  })

  it('returns null when result is not a string', () => {
    expect(
      unwrapCursorResponse(envelope({ result: { verdict: 'clean' } })),
    ).toBeNull()
  })

  it('returns null for a JSON scalar rather than reading it as an envelope', () => {
    expect(unwrapCursorResponse('"clean"')).toBeNull()
    expect(unwrapCursorResponse('null')).toBeNull()
  })
})
