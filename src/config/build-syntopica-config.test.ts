import { describe, expect, it } from 'vitest'

import { join } from 'node:path'
import { syntopicaConfigTestState } from '../testing/syntopica-config-test-state.ts'
import { buildSyntopicaConfig } from './build-syntopica-config.ts'

describe('buildSyntopicaConfig', () => {
  it('produces an immutable snapshot with browser environment paths relative to data', () => {
    const { document, origins, data, root } = syntopicaConfigTestState()
    document['browser'] = { executable: './browser' }
    origins.set('browser.executable', root)
    const config = buildSyntopicaConfig(document, origins, data, {
      CLIPS_HEADLESS_BROWSER: './browser',
    })
    expect(config.browser).toBe(join(data, 'browser'))
    expect(Object.isFrozen(config)).toBe(true)
    expect(Object.isFrozen(config.runners)).toBe(true)
    document['runners'] = { grade: 'cursor' }
    expect(config.runners['grade']).toBeNull()
    expect(buildSyntopicaConfig(document, origins, data, {}).browser).toBe(
      join(root, 'browser'),
    )
  })
})
