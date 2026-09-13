import { describe, expect, it } from 'vitest'
import { parseTriageVerdicts } from './parse-triage-verdicts.ts'
import { unwrapAgyResponse } from './unwrap-agy-response.ts'

const verdicts = {
  verdicts: [{ id: 0, bucket: 'ingest', topic: 'ai-agents', reason: 'ok' }],
}

describe('unwrapAgyResponse', () => {
  it('prefers structured_output, the schema-constrained answer', () => {
    // `response` carries the model's prose with the JSON repeated inside it,
    // which does not parse. Reading it first degraded every agy batch.
    const stdout = JSON.stringify({
      status: 'SUCCESS',
      response: 'Here is the answer.\n{"verdicts":[]}\n',
      structured_output: { verdicts: [{ id: 1 }] },
    })

    expect(unwrapAgyResponse(stdout)).toBe('{"verdicts":[{"id":1}]}')
  })

  it('returns the stringified answer agy nests in response', () => {
    const stdout = JSON.stringify({
      conversation_id: 'c1',
      status: 'ok',
      response: JSON.stringify(verdicts),
      usage: {},
    })

    expect(unwrapAgyResponse(stdout)).toBe(JSON.stringify(verdicts))
  })

  it('feeds parseTriageVerdicts directly, the way the runner uses it', () => {
    const stdout = JSON.stringify({ response: JSON.stringify(verdicts) })

    const parsed = parseTriageVerdicts(unwrapAgyResponse(stdout))

    expect(parsed.get(0)).toEqual({
      bucket: 'ingest',
      topic: 'ai-agents',
      reason: 'ok',
    })
  })

  it('re-stringifies when agy inlines the object instead', () => {
    const stdout = JSON.stringify({ response: verdicts })

    expect(parseTriageVerdicts(unwrapAgyResponse(stdout)).size).toBe(1)
  })

  it('returns null for output that is not JSON at all', () => {
    // What a crashed or unauthenticated agy actually prints.
    expect(unwrapAgyResponse('Error: timeout waiting for response')).toBeNull()
  })

  it('returns null when the envelope carries no response field', () => {
    expect(unwrapAgyResponse(JSON.stringify({ status: 'error' }))).toBeNull()
  })

  it('returns null for a JSON scalar rather than an envelope', () => {
    expect(unwrapAgyResponse('"just a string"')).toBeNull()
    expect(unwrapAgyResponse('null')).toBeNull()
  })

  it('degrades an unreadable envelope to no verdicts, never to rejections', () => {
    // The caller turns unmatched articles into "review", so a broken transport
    // must yield an empty map rather than anything that looks like a decision.
    expect(parseTriageVerdicts(unwrapAgyResponse('not json')).size).toBe(0)
  })
})
