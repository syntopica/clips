import { join } from 'node:path'

import { expect, it } from 'vitest'

import { temporaryDir } from '../testing/temporary-dir.ts'
import { classifySyntopicaPaths } from './classify-syntopica-paths.ts'

it.each([undefined, 'optional', false])(
  'requires explicit path classification: %s',
  (kind) => {
    const root = temporaryDir('syntopica-path-kinds-')
    const schema = {
      properties: { brain: { properties: { pages: { 'x-path-kind': kind } } } },
    }
    expect(() =>
      classifySyntopicaPaths(
        new Map([['brain.pages', [join(root, 'notes')]]]),
        schema,
      ),
    ).toThrow('brain.pages must declare x-path-kind as required or state')
  },
)

it('classifies new state fields from the schema', () => {
  const root = temporaryDir('syntopica-path-kinds-')
  const state = join(root, 'new-state')
  const schema = {
    properties: { newState: { type: 'string', 'x-path-kind': 'state' } },
  }
  expect(
    classifySyntopicaPaths(new Map([['newState', [state]]]), schema),
  ).toEqual({ configuredPaths: [], statePaths: [state] })
})
