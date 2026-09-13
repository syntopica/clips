import { describe, expect, it } from 'vitest'
import { brainWith } from './brain-fixture.ts'
import { findStaleVerifications } from './find-stale-verifications.ts'

const page = (frontmatter: string): string =>
  `---\ntitle: t\ntype: topic\nupdated: 2026-08-03\n${frontmatter}sources:\n  - SCHEMA.md\n---\n\nbody\n`

const TODAY = new Date('2026-08-03T09:00:00Z')

describe('findStaleVerifications', () => {
  it('says nothing about a claim inside the window', async () => {
    const brain = brainWith({
      'topics/a.md': page('last_verified: 2026-05-01\n'),
    })

    expect(await findStaleVerifications(brain, TODAY)).toEqual([])
  })

  it('ages a claim out at 120 days', async () => {
    const brain = brainWith({
      'topics/a.md': page('last_verified: 2026-04-05\n'),
    })

    expect(await findStaleVerifications(brain, TODAY)).toEqual([
      {
        check: 'stale-verification',
        subject: 'topics/a.md',
        detail: 'last verified 2026-04-05, 120 days ago; past the 120-day line',
      },
    ])
  })

  it('says nothing about a page that never claimed one', async () => {
    // The field is optional on purpose: demanding it of every page would fire
    // on all of them the day the check shipped, which is the always-fires
    // shape this audit removed a check for once already.
    const brain = brainWith({ 'topics/a.md': page('') })

    expect(await findStaleVerifications(brain, TODAY)).toEqual([])
  })

  it('reports a claim it cannot read rather than treating it as absent', async () => {
    const brain = brainWith({
      'topics/a.md': page('last_verified: last spring\n'),
    })

    expect(await findStaleVerifications(brain, TODAY)).toEqual([
      {
        check: 'stale-verification',
        subject: 'topics/a.md',
        detail:
          'declares `last_verified:` but not as a bare `YYYY-MM-DD` date, so the claim cannot be aged',
      },
    ])
  })

  it('leaves an exempt page alone, however old its claim', async () => {
    // Nothing here can verify an exempt page, so there is no reading for a
    // date to record and nothing for this check to age.
    const brain = brainWith({
      'topics/a.md': page('verification: exempt\nlast_verified: 2020-01-01\n'),
    })

    expect(await findStaleVerifications(brain, TODAY)).toEqual([])
  })

  it('ignores files outside the page directories', async () => {
    const brain = brainWith({
      'docs/a.md': page('last_verified: 2020-01-01\n'),
    })

    expect(await findStaleVerifications(brain, TODAY)).toEqual([])
  })
})
