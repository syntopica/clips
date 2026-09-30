import { buildSyntopicaConfig } from '../config/build-syntopica-config.ts'
import type { SyntopicaConfig } from '../config/syntopica-config.ts'
import { git } from './git.ts'
import { syntopicaConfigTestState } from './syntopica-config-test-state.ts'

/** A real instance whose wiki lives under `brain/` - pages in `brain/notes`,
 * the index at `brain/index.md`, the ledger in `brain/.ingest` - the shape the
 * owner's instance took on 2026-09-14. The data directory is a git repository
 * with an identity configured, so a test can commit into it. */
export const nestedWikiConfig = (): {
  data: string
  config: SyntopicaConfig
} => {
  const { document, origins, data, schema } = syntopicaConfigTestState()
  git(data, 'config', 'user.email', 'test@example.com')
  git(data, 'config', 'user.name', 'Test')
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
