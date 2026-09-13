import { describe, expect, it } from 'vitest'
import { brainWith } from './brain-fixture.ts'
import { findUncitedSources } from './find-uncited-sources.ts'
import { pageWithSources } from './page-with-sources-fixture.ts'

/** A source entry the fixture pages list first, so it is S1. */
const SCHEMA_SOURCE = 'SCHEMA.md'
/** The source entry the fixture pages list second, so it is S2. */
const SOURCE_A = 'https://a.example/'

describe('findUncitedSources', () => {
  it('reports a source no claim on a marked page cites', async () => {
    const brain = brainWith({
      'topics/a.md': pageWithSources(
        [SCHEMA_SOURCE, SOURCE_A],
        'Only the first is cited [S1].',
      ),
    })

    expect(await findUncitedSources(brain)).toEqual([
      {
        check: 'uncited-source',
        subject: 'topics/a.md',
        detail: 'S2 listed in sources and cited by no claim',
      },
    ])
  })

  it('stays silent on a grandfathered page, where every source is uncited', async () => {
    const brain = brainWith({
      'topics/a.md': pageWithSources(
        [SCHEMA_SOURCE, SOURCE_A],
        'Prose written before the scheme existed.',
      ),
    })

    expect(await findUncitedSources(brain)).toEqual([])
  })

  it('stays silent on a half-marked page, where uncited sources outnumber cited ones', async () => {
    // A run appended one marked sentence to a grandfathered page: its own
    // source is cited, the pre-scheme majority is not, and none of that is a
    // lost marker.
    const brain = brainWith({
      'topics/a.md': pageWithSources(
        [SOURCE_A, 'https://b.example/', 'https://c.example/'],
        'Prose written before the scheme. The appended claim [S3].',
      ),
    })

    expect(await findUncitedSources(brain)).toEqual([])
  })

  it('says nothing when every source is cited', async () => {
    const brain = brainWith({
      'topics/a.md': pageWithSources(
        [SCHEMA_SOURCE, SOURCE_A],
        'One [S1] and two [S2].',
      ),
    })

    expect(await findUncitedSources(brain)).toEqual([])
  })

  it('does not read OWN as leaving a source uncited on its own', async () => {
    const brain = brainWith({
      'topics/a.md': pageWithSources([SCHEMA_SOURCE], 'Mine alone [OWN].'),
    })

    expect(await findUncitedSources(brain)).toEqual([
      {
        check: 'uncited-source',
        subject: 'topics/a.md',
        detail: 'S1 listed in sources and cited by no claim',
      },
    ])
  })
})
