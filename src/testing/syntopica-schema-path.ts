import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/** The configuration schema, wherever this checkout keeps it.
 *
 * The package is `tools/clips` in the monorepo and the repository itself once
 * published, so the schema sits four or two directories up depending on which
 * checkout is running. Resolved rather than assumed: one wrong guess is a
 * fixture that cannot build and a suite that cannot run. */
export function syntopicaSchemaPath(): string {
  for (const candidate of [
    '../../../../schema/syntopica-config.schema.json',
    '../../schema/syntopica-config.schema.json',
  ]) {
    const path = fileURLToPath(new URL(candidate, import.meta.url))
    if (existsSync(path)) return path
  }
  throw new Error('Cannot locate schema/syntopica-config.schema.json')
}
