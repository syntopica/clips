import { describe, expect, it } from 'vitest'
import { agyReviewer } from './agy-reviewer.ts'

describe('agyReviewer', () => {
  it('refuses to review a diff its own model wrote', async () => {
    // The runtime fallback selectReviewer cannot see: agy's Claude quota
    // emptied mid-batch on 2026-08-08 and synthesis continued on the gate's own
    // model. A gate marking its own work returns a verdict that reads exactly
    // like a real one.
    let fetched = false
    const outcome = await agyReviewer('gemini-3.1-pro-high').review({
      summary: 'a summary',
      authorModel: 'gemini-3.1-pro-high',
      clipId: '01M098Y2MEC0V8XXXXXXXXXXXX',
      fullDiff: async () => {
        fetched = true
        return Promise.resolve('diff')
      },
    })

    expect(outcome.verdict).toBe('claude')
    expect(outcome.reason).toContain("this gate's own model")
    // It escalates before reading the diff, so no model is spent on a verdict
    // that could not have counted.
    expect(fetched).toBe(false)
  })
})
