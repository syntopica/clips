import { describe, expect, it } from 'vitest'
import { vexaMessageHtml } from './vexa-message-html.ts'

describe('vexaMessageHtml', () => {
  it('reads body_html from the one-element list vexa message prints', () => {
    expect(vexaMessageHtml('[{"body_html":"<p>hi</p>"}]')).toBe('<p>hi</p>')
  })

  it('answers empty when the body was evicted from the cache', () => {
    expect(vexaMessageHtml('[{"body_html":null}]')).toBe('')
  })
})
