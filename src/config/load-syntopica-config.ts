import { buildSyntopicaConfig } from './build-syntopica-config.ts'
import { InvalidSyntopicaConfigError } from './invalid-syntopica-config-error.ts'
import { isSyntopicaObject } from './is-syntopica-object.ts'
import { loadSyntopicaSchema } from './load-syntopica-schema.ts'
import { mergeConfigOverrides } from './merge-config-overrides.ts'
import { mergeSyntopicaDocuments } from './merge-syntopica-documents.ts'
import { readSyntopicaLayers } from './read-syntopica-layers.ts'
import { resolveSyntopicaPath } from './resolve-syntopica-path.ts'
import type { SyntopicaConfig } from './syntopica-config.ts'
import { syntopicaSchemaDefaults } from './syntopica-schema-defaults.ts'
import { syntopicaValueAt } from './syntopica-value-at.ts'
import { syntopicaValueOrigins } from './syntopica-value-origins.ts'
import { validateSyntopicaGitRoots } from './validate-syntopica-git-roots.ts'
import { validateSyntopicaSchema } from './validate-syntopica-schema.ts'
import { validateSyntopicaUrls } from './validate-syntopica-urls.ts'

export function loadSyntopicaConfig(
  root: string,
  environ: NodeJS.ProcessEnv,
): SyntopicaConfig {
  try {
    const resolvedRoot = resolveSyntopicaPath(root)
    const layers = readSyntopicaLayers(resolvedRoot)
    const schema = loadSyntopicaSchema(layers.document, layers.origins)
    const defaults = syntopicaSchemaDefaults(schema)
    const origins = new Map([
      ...syntopicaValueOrigins(defaults, layers.trackedDirectory),
      ...layers.origins,
    ])
    let document = mergeSyntopicaDocuments(defaults, layers.document)
    validateSyntopicaSchema(document, schema)
    document = mergeConfigOverrides(document, environ)
    validateSyntopicaSchema(document, schema)
    // The schema requires only the brain engine, because a brain-only
    // instance is valid for brain; this engine cannot run without itself.
    const engines = syntopicaValueAt(document, 'engines')
    if (!isSyntopicaObject(engines) || !Object.hasOwn(engines, 'clips'))
      throw new InvalidSyntopicaConfigError(
        'engines.clips is required by the clips engine',
      )
    validateSyntopicaUrls(document)
    const config = buildSyntopicaConfig({
      document,
      origins,
      root: resolvedRoot,
      environ,
      schema,
    })
    validateSyntopicaGitRoots([
      resolvedRoot,
      config.archive,
      config.brainPath,
      config.clipsPath,
    ])
    return config
  } catch (error) {
    if (error instanceof InvalidSyntopicaConfigError) throw error
    throw new InvalidSyntopicaConfigError('Cannot resolve configuration files')
  }
}
