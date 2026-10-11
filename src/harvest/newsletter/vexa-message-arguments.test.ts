import { describe, expect, it } from 'vitest'
import { vexaMessageArguments } from './vexa-message-arguments.ts'

describe('vexaMessageArguments', () => {
  it('puts a dash-leading id after the end-of-options marker', () => {
    const args = vexaMessageArguments('-abc123')
    expect(args.at(-1)).toBe('-abc123')
    expect(args.at(-2)).toBe('--')
    expect(args.indexOf('-abc123')).toBe(args.length - 1)
  })

  it('asks for the HTML body as JSON', () => {
    expect(vexaMessageArguments('m1')).toEqual([
      'message',
      '--json',
      '--fields',
      'body_html',
      '--',
      'm1',
    ])
  })
})
