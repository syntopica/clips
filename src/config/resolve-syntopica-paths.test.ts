import { describe, expect, it } from 'vitest'

import { join } from 'node:path'
import { syntopicaConfigTestState } from '../testing/syntopica-config-test-state.ts'
import { resolveSyntopicaPaths } from './resolve-syntopica-paths.ts'

describe('resolveSyntopicaPaths', () => {
  it('includes optional paths and enforces containment on optional settings', () => {
    const { document, origins, data } = syntopicaConfigTestState()
    const paths = resolveSyntopicaPaths(document, origins, data)
    expect(paths.newsletterRejectedBookingSenders).toBe(
      join(data, '.config/newsletter-rejected-booking.json'),
    )
    expect(paths.projectRoots).toEqual([])
    document['mem'] = { path: '../escape' }
    expect(() => resolveSyntopicaPaths(document, origins, data)).toThrow(
      'escapes',
    )
  })
})
