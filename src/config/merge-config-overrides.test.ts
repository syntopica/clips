import { describe, expect, it } from 'vitest'

import { mergeConfigOverrides } from './merge-config-overrides.ts'

describe('mergeConfigOverrides', () => {
  it('never enumerates environment keys or accesses runtime credentials', () => {
    const environ: NodeJS.ProcessEnv = { CLIPS_GRADE_RUNNER: 'cursor' }
    Object.defineProperty(environ, 'CAPTURE_TOKEN', {
      get() {
        throw new Error('Credential access')
      },
    })
    const document = { runners: { grade: null, synthesis: 'manual' } }
    expect(mergeConfigOverrides(document, environ)).toEqual({
      runners: { grade: 'cursor', synthesis: 'manual' },
    })
    expect(document.runners.grade).toBeNull()
  })
})
