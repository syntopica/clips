import { describe, expect, it } from 'vitest'
import { brainWith } from './brain-fixture.ts'
import { findUnresolvedClaimRefs } from './find-unresolved-claim-refs.ts'
import { pageWithSources } from './page-with-sources-fixture.ts'

describe('findUnresolvedClaimRefs', () => {
  it('reports a marker naming a source the page does not have', async () => {
    const brain = brainWith({
      'topics/a.md': pageWithSources(['SCHEMA.md'], 'A claim [S2].'),
    })

    expect(await findUnresolvedClaimRefs(brain)).toEqual([
      {
        check: 'unresolved-claim-ref',
        subject: 'topics/a.md',
        detail: 'S2 names no entry in a 1-source list',
      },
    ])
  })

  it('says nothing about a page whose markers all resolve', async () => {
    const brain = brainWith({
      'topics/a.md': pageWithSources(
        ['SCHEMA.md', 'https://a.example/'],
        'One [S1]. Two [S2]. Mine [OWN].',
      ),
    })

    expect(await findUnresolvedClaimRefs(brain)).toEqual([])
  })

  it('says nothing about the grandfathered pages, which carry no markers', async () => {
    const brain = brainWith({
      'topics/a.md': pageWithSources(
        [],
        'Prose written before the scheme existed.',
      ),
      'business/b.md': pageWithSources(['SCHEMA.md'], 'More of the same.'),
    })

    expect(await findUnresolvedClaimRefs(brain)).toEqual([])
  })
})
