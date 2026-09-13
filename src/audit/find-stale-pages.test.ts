import { describe, expect, it } from 'vitest'
import { brainWith } from './brain-fixture.ts'
import { findStalePages } from './find-stale-pages.ts'

const page = (updated: string): string =>
  `---\ntitle: t\ntype: topic\nupdated: ${updated}\nsources:\n  - SCHEMA.md\n---\n\nbody\n`

const TODAY = new Date('2026-08-02T09:00:00Z')

describe('findStalePages', () => {
  it('says nothing about a page inside the review window', async () => {
    const brain = brainWith({ 'topics/a.md': page('2026-07-24') })

    expect(await findStalePages(brain, TODAY)).toEqual([])
  })

  it('asks for a review at 30 days', async () => {
    const brain = brainWith({ 'topics/a.md': page('2026-07-03') })

    expect(await findStalePages(brain, TODAY)).toEqual([
      {
        check: 'stale-page',
        subject: 'topics/a.md',
        detail: 'last updated 2026-07-03, 30 days ago; due a review at 30 days',
      },
    ])
  })

  it('calls a page stale at 90 days', async () => {
    const brain = brainWith({ 'topics/a.md': page('2026-05-04') })

    expect(await findStalePages(brain, TODAY)).toEqual([
      {
        check: 'stale-page',
        subject: 'topics/a.md',
        detail:
          'last updated 2026-05-04, 90 days ago; past the 90-day stale line',
      },
    ])
  })

  it('reports a page whose age cannot be read rather than skipping it', async () => {
    // The oldest pages are the likeliest to predate the pipeline, so skipping
    // an unreadable date would hide exactly what the check is looking for.
    const brain = brainWith({
      'topics/a.md': '---\ntitle: t\nupdated: last week\n---\n\nbody\n',
    })

    expect(await findStalePages(brain, TODAY)).toEqual([
      {
        check: 'stale-page',
        subject: 'topics/a.md',
        detail: 'no readable `updated:` date, so its age cannot be judged',
      },
    ])
  })

  it('leaves a date in the future alone', async () => {
    const brain = brainWith({ 'topics/a.md': page('2026-09-01') })

    expect(await findStalePages(brain, TODAY)).toEqual([])
  })

  it('ignores files outside the page directories', async () => {
    const brain = brainWith({ 'docs/a.md': page('2020-01-01') })

    expect(await findStalePages(brain, TODAY)).toEqual([])
  })
})
