import { describe, expect, it } from 'vitest'
import { isTranscriptHost } from './is-transcript-host.ts'

describe('isTranscriptHost', () => {
  it('recognises the YouTube hosts a share sheet produces', () => {
    expect(
      isTranscriptHost('https://www.youtube.com/watch?v=zmrPY6S1FwY'),
    ).toBe(true)
    expect(isTranscriptHost('https://youtube.com/watch?v=x')).toBe(true)
    expect(isTranscriptHost('https://youtu.be/zmrPY6S1FwY')).toBe(true)
    expect(isTranscriptHost('https://m.youtube.com/watch?v=x')).toBe(true)
  })

  it('leaves every other host on the synchronous path', () => {
    expect(isTranscriptHost('https://medium.com/@someone/post')).toBe(false)
    expect(isTranscriptHost('https://www.anthropic.com/news/x')).toBe(false)
  })

  it('does not match a host that merely ends in the name', () => {
    expect(isTranscriptHost('https://notyoutube.com/watch?v=x')).toBe(false)
    expect(isTranscriptHost('https://youtube.com.evil.test/watch?v=x')).toBe(
      false,
    )
  })

  it('is false for a string that is not a URL', () => {
    expect(isTranscriptHost('watch?v=x')).toBe(false)
  })
})
