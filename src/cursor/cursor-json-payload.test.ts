import { describe, expect, it } from 'vitest'
import { cursorJsonPayload } from './cursor-json-payload.ts'

const OK_JSON = '{"ok":true}'

describe('cursorJsonPayload', () => {
  it('finds the contract object after the narration that precedes it', () => {
    // The measured first real synthesis run: the page was written correctly and
    // the clip escalated anyway, because JSON.parse threw on the whole string.
    const answer =
      'Using the `brain` skill to synthesize this clip; then return the ' +
      'required JSON.{"pages_touched":["topics/a.md"],"needs_claude":false,' +
      '"reason":"done"}'

    expect(JSON.parse(cursorJsonPayload(answer) ?? '')).toEqual({
      pages_touched: ['topics/a.md'],
      needs_claude: false,
      reason: 'done',
    })
  })

  it('takes the last object, not the first', () => {
    // Narration quotes shapes and paths; the contract is by construction last.
    const answer = 'I planned {"draft":true} and then wrote {"final":true}'

    expect(cursorJsonPayload(answer)).toBe('{"final":true}')
  })

  it('is not unbalanced by a brace inside a string', () => {
    const answer = 'note: {"reason":"the page said {this} verbatim"}'

    expect(JSON.parse(cursorJsonPayload(answer) ?? '')).toEqual({
      reason: 'the page said {this} verbatim',
    })
  })

  it('is not unbalanced by an escaped quote inside a string', () => {
    const answer = String.raw`{"reason":"he said \"no\" twice"}`

    expect(cursorJsonPayload(answer)).toBe(answer)
  })

  it('skips balanced braces that are not JSON', () => {
    const answer = 'shell said ${HOME} and then {"ok":true}'

    expect(cursorJsonPayload(answer)).toBe(OK_JSON)
  })

  it('returns a bare object unchanged, which is the disciplined case', () => {
    expect(cursorJsonPayload(OK_JSON)).toBe(OK_JSON)
  })

  it('returns null when the answer carries no object at all', () => {
    expect(cursorJsonPayload('I could not complete that.')).toBeNull()
  })

  it('returns null for an unterminated object rather than guessing', () => {
    expect(cursorJsonPayload('{"pages_touched":["a.md"')).toBeNull()
  })

  it('handles a fenced object, which is the other shape a model reaches for', () => {
    expect(cursorJsonPayload('```json\n{"ok":true}\n```')).toBe(OK_JSON)
  })
})
