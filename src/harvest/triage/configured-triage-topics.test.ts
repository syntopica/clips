import { describe, expect, it } from 'vitest'

import { buildSyntopicaConfig } from '../../config/build-syntopica-config.ts'
import { withSyntopicaConfig } from '../../config/with-syntopica-config.ts'
import { syntopicaConfigTestState } from '../../testing/syntopica-config-test-state.ts'
import { configuredTriageTopics } from './configured-triage-topics.ts'

describe('configuredTriageTopics', () => {
  it('reads the instance list and always ends in exactly one other', () => {
    const { document, origins, data, schema } = syntopicaConfigTestState()
    document['newsletter'] = {
      ...(document['newsletter'] as Record<string, unknown>),
      triageTopics: ['other', 'compilers', 'type-systems'],
    }
    const config = buildSyntopicaConfig({
      document,
      origins,
      root: data,
      environ: {},
      schema,
    })
    withSyntopicaConfig(config, () => {
      expect(configuredTriageTopics()).toEqual([
        'compilers',
        'type-systems',
        'other',
      ])
    })
  })
})
