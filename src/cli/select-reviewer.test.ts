import { afterEach, describe, expect, it, vi } from 'vitest'
import { selectReviewer } from './select-reviewer.ts'

describe('selectReviewer', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('puts the automatic gate on the worker when CLIPS_REVIEW_RUNNER asks for it', () => {
    const lines: string[] = []
    vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      lines.push(String(chunk))
      return true
    })

    const reviewer = selectReviewer(true, { CLIPS_REVIEW_RUNNER: 'worker' })

    expect(reviewer.automatic).toBe(true)
    expect(lines.join('')).toContain('reviewer: worker clips.review')
  })
})
