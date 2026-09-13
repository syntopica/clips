import { resolveSyntopicaFieldPath } from './resolve-syntopica-field-path.ts'
import { resolveSyntopicaFieldPaths } from './resolve-syntopica-field-paths.ts'
import type { ResolvedSyntopicaPaths } from './resolved-syntopica-paths.ts'
import { syntopicaScalarPathFields } from './syntopica-scalar-path-fields.ts'

export function resolveSyntopicaPaths(
  document: Record<string, unknown>,
  origins: ReadonlyMap<string, string>,
  root: string,
): ResolvedSyntopicaPaths {
  const scalars = Object.fromEntries(
    Object.entries(syntopicaScalarPathFields).map(([key, field]) => [
      key,
      resolveSyntopicaFieldPath(document, origins, root, field),
    ]),
  ) as Readonly<Record<keyof typeof syntopicaScalarPathFields, string>>
  return {
    ...scalars,
    pages: resolveSyntopicaFieldPaths(document, origins, root, 'brain.pages'),
    projectRoots: resolveSyntopicaFieldPaths(
      document,
      origins,
      root,
      'projects.roots',
    ),
  }
}
