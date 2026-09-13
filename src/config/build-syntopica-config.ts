import { resolveSyntopicaBrowser } from './resolve-syntopica-browser.ts'
import { resolveSyntopicaFieldPath } from './resolve-syntopica-field-path.ts'
import { resolveSyntopicaFieldPaths } from './resolve-syntopica-field-paths.ts'
import { resolveSyntopicaPaths } from './resolve-syntopica-paths.ts'
import type { SyntopicaConfig } from './syntopica-config.ts'
import { syntopicaScalarFields } from './syntopica-scalar-fields.ts'
import { syntopicaValueAt } from './syntopica-value-at.ts'

export function buildSyntopicaConfig(
  document: Record<string, unknown>,
  origins: ReadonlyMap<string, string>,
  root: string,
  environ: NodeJS.ProcessEnv,
): SyntopicaConfig {
  const browserOrigin =
    environ['CLIPS_HEADLESS_BROWSER'] === undefined
      ? (origins.get('browser.executable') ?? root)
      : root
  return Object.freeze({
    ...resolveSyntopicaPaths(document, origins, root),
    ...syntopicaScalarFields(document),
    dataRoot: root,
    legacyArchive:
      syntopicaValueAt(document, 'clips.legacyArchive') === null
        ? null
        : resolveSyntopicaFieldPath(
            document,
            origins,
            root,
            'clips.legacyArchive',
          ),
    desktopRoots: resolveSyntopicaFieldPaths(
      document,
      origins,
      root,
      'sessions.desktopRoots',
    ),
    browser: resolveSyntopicaBrowser(
      syntopicaValueAt(document, 'browser.executable') as string | null,
      browserOrigin,
    ),
  })
}
