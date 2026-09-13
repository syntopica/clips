import { describe, expect, it } from 'vitest'
import { captureAsArticle } from './capture-as-article.ts'
import type { UndrainedCapture } from './undrained-capture.ts'

const capture = (note: string | null): UndrainedCapture => ({
  capture_id: '01KYQ1FCSV39T4YBVT6QCH02QQ',
  url: 'https://medium.com/@someone/a-post-0123456789ab',
  note,
  capture_source: 'ios-shortcut',
  captured_at: '2026-08-04T09:15:00+02:00',
})

describe('captureAsArticle', () => {
  it('carries the note through as the topic', () => {
    expect(captureAsArticle(capture('rust'))).toEqual({
      url: 'https://medium.com/@someone/a-post-0123456789ab',
      title: '',
      topic: 'rust',
    })
  })

  // The Shortcut's note prompt is optional, and `tags` is a string array, so a
  // null reaching `buildClipMetadata` would put a null inside it.
  it('turns an absent note into an empty topic', () => {
    expect(captureAsArticle(capture(null)).topic).toBe('')
  })
})
