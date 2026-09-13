import { describe, expect, it } from 'vitest'
import type { UndrainedCapture } from '../capture/undrained-capture.ts'
import { formatDrainSummary } from './format-drain-summary.ts'

const capture: UndrainedCapture = {
  capture_id: '01KYQ1FCSV39T4YBVT6QCH02QQ',
  url: 'https://medium.com/@someone/a-post-0123456789ab',
  note: null,
  capture_source: 'ios-shortcut',
  captured_at: '2026-08-04T09:15:00+02:00',
}

describe('formatDrainSummary', () => {
  it('counts an empty inbox without listing anything', () => {
    expect(formatDrainSummary([])).toBe('0 undrained captures\n')
  })

  it('lists each capture under the count', () => {
    expect(formatDrainSummary([capture])).toBe(
      '1 undrained captures\n' +
        '  2026-08-04T09:15:00+02:00  ios-shortcut  https://medium.com/@someone/a-post-0123456789ab\n',
    )
  })
})
