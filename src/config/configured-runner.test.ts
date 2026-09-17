import { describe, expect, it } from 'vitest'

import { syntopicaConfigTestState } from '../testing/syntopica-config-test-state.ts'
import { buildSyntopicaConfig } from './build-syntopica-config.ts'
import { configuredRunner } from './configured-runner.ts'
import { withSyntopicaConfig } from './with-syntopica-config.ts'

describe('configuredRunner', () => {
  it('reads each stage from the instance in scope', () => {
    // The whole point of the function: until the selectors read this, a
    // `runners` block changed what doctor printed and nothing about what ran.
    const { document, origins, data, schema } = syntopicaConfigTestState()
    // `CLIPS_*_RUNNER` reaches this block through the loader, which merges the
    // variables into the document before validating it; by here it is settled.
    document['runners'] = { synthesis: 'codex', grade: 'cursor' }
    const config = buildSyntopicaConfig({
      document,
      origins,
      root: data,
      environ: {},
      schema,
    })
    withSyntopicaConfig(config, () => {
      expect(configuredRunner('synthesis')).toBe('codex')
      expect(configuredRunner('grade')).toBe('cursor')
      expect(configuredRunner('triage')).toBeNull()
    })
  })
})
