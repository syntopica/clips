import { vi } from 'vitest'
import { syntopicaConfigContext } from '../config/syntopica-config-context.ts'
import { FLAT_WIKI_LAYOUT } from './flat-wiki-layout.ts'

// Most suites exercise one module against a throwaway directory and never load
// an instance, so they have no configuration in scope for the layout to be
// read from. They get the flat layout they were written against; a test that
// puts a configuration in scope with `withSyntopicaConfig` gets that
// configuration's layout instead, which is how the nested cases are tested.
// Production has no such fallback: the CLI always runs inside a loaded config.
vi.mock(import('../layout/current-wiki-layout.ts'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    currentWikiLayout: () =>
      syntopicaConfigContext.getStore() === undefined
        ? FLAT_WIKI_LAYOUT
        : actual.currentWikiLayout(),
  }
})
