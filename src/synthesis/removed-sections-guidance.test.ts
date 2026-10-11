import { describe, expect, it } from 'vitest'
import { removedSectionsGuidance } from './removed-sections-guidance.ts'

describe('removedSectionsGuidance', () => {
  it('starts with the refusal when there was no earlier guidance', () => {
    expect(removedSectionsGuidance('', 'p.md: why')).toMatch(
      /^The validator refused your previous draft of this clip: p\.md: why\./u,
    )
  })

  it('keeps the rejection guidance the run already carried', () => {
    expect(removedSectionsGuidance('A reviewer said no.', 'p.md: why')).toMatch(
      /^A reviewer said no\.\n\nThe validator refused/u,
    )
  })
})
