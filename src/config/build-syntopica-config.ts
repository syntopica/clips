import { classifySyntopicaPaths } from './classify-syntopica-paths.ts'
import { resolveSyntopicaBrowser } from './resolve-syntopica-browser.ts'
import { resolveSyntopicaFieldPath } from './resolve-syntopica-field-path.ts'
import { resolveSyntopicaFieldPaths } from './resolve-syntopica-field-paths.ts'
import { resolveSyntopicaPaths } from './resolve-syntopica-paths.ts'
import type { SyntopicaConfigInput } from './syntopica-config-input.ts'
import type { SyntopicaConfig } from './syntopica-config.ts'
import { syntopicaPathsByField } from './syntopica-paths-by-field.ts'
import { syntopicaScalarFields } from './syntopica-scalar-fields.ts'
import { syntopicaValueAt } from './syntopica-value-at.ts'

export function buildSyntopicaConfig({
  document,
  origins,
  root,
  environ,
  schema,
}: SyntopicaConfigInput): SyntopicaConfig {
  const browserOrigin =
    environ['CLIPS_HEADLESS_BROWSER'] === undefined
      ? (origins.get('browser.executable') ?? root)
      : root
  const paths = resolveSyntopicaPaths(document, origins, root)
  const inbox =
    syntopicaValueAt(document, 'clips.inbox') === null
      ? null
      : resolveSyntopicaFieldPath(document, origins, root, 'clips.inbox')
  const desktopRoots = resolveSyntopicaFieldPaths(
    document,
    origins,
    root,
    'sessions.desktopRoots',
  )
  const pathKinds = classifySyntopicaPaths(
    syntopicaPathsByField(paths, inbox, desktopRoots),
    schema,
  )
  return Object.freeze({
    ...paths,
    ...pathKinds,
    ...syntopicaScalarFields(document),
    dataRoot: root,
    inbox,
    desktopRoots,
    browser: resolveSyntopicaBrowser(
      syntopicaValueAt(document, 'browser.executable') as string | null,
      browserOrigin,
    ),
  })
}
