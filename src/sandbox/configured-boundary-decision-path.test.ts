import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { buildSyntopicaConfig } from '../config/build-syntopica-config.ts'
import { withSyntopicaConfig } from '../config/with-syntopica-config.ts'
import { syntopicaConfigTestState } from '../testing/syntopica-config-test-state.ts'
import { BOUNDARY_DECISION_PATH } from './boundary-decision-path.ts'
import { configuredBoundaryDecisionPath } from './configured-boundary-decision-path.ts'

const configWith = (boundaryDecision: string | null) => {
  const { document, origins, data, schema } = syntopicaConfigTestState()
  document['clips'] = {
    ...(document['clips'] as Record<string, unknown>),
    boundaryDecision,
  }
  return {
    data,
    config: buildSyntopicaConfig({
      document,
      origins,
      root: data,
      environ: {},
      schema,
    }),
  }
}

describe('configuredBoundaryDecisionPath', () => {
  it("falls back to the engine's refusing decision when unset", () => {
    const { config } = configWith(null)
    withSyntopicaConfig(config, () => {
      expect(configuredBoundaryDecisionPath()).toBe(BOUNDARY_DECISION_PATH)
    })
  })

  it("reads the instance's decision, resolved inside the data directory", () => {
    const { config, data } = configWith('decisions/boundary.json')
    withSyntopicaConfig(config, () => {
      expect(configuredBoundaryDecisionPath()).toBe(
        join(data, 'decisions/boundary.json'),
      )
    })
    expect(config.configuredPaths).toContain(
      join(data, 'decisions/boundary.json'),
    )
  })
})
