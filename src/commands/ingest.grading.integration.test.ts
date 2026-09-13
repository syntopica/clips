import { describe, expect, it } from 'vitest'
import { fixture } from './ingest-test-fixture.ts'
import { options } from './ingest-test-options.ts'
import { PAGE_BODY } from './ingest-test-page-body.ts'
import { PAGE } from './ingest-test-page.ts'
import { verdictReviewer } from './ingest-test-verdict-reviewer.ts'
import { writingSynthesizer } from './ingest-test-writing-synthesizer.ts'
import { ingest } from './ingest.ts'

describe('clips ingest - grading a published clip', () => {
  it('grades the pages a published clip created, and only those', async () => {
    const { brain, clips } = fixture()
    const graded: string[][] = []
    const exit = await ingest({ brain, clips }, options, {
      synthesizer: writingSynthesizer(PAGE_BODY),
      grader: {
        grade: async (_brain, _clips, pages) => {
          graded.push([...pages])
          return Promise.resolve(0)
        },
      },
      reviewer: verdictReviewer('apply'),
    })
    expect(exit).toBe(0)
    // index.md is regenerated on every run, so it is in the committed set - but
    // it existed before the run, so it is not a created page. A grader that saw
    // anything but the new page would be grading text an earlier pass already
    // cleared, which is the spend this flag exists to avoid.
    expect(graded).toEqual([[PAGE]])
  })

  it('does not grade when no grader is wired', async () => {
    const { brain, clips } = fixture()
    const exit = await ingest({ brain, clips }, options, {
      synthesizer: writingSynthesizer(PAGE_BODY),
      grader: null,
      reviewer: verdictReviewer('apply'),
    })
    expect(exit).toBe(0)
  })
})
