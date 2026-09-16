import type { ResolvedSyntopicaPaths } from './resolved-syntopica-paths.ts'
import { syntopicaScalarPathFields } from './syntopica-scalar-path-fields.ts'

export function syntopicaPathsByField(
  paths: ResolvedSyntopicaPaths,
  inbox: string | null,
  desktopRoots: readonly string[],
): ReadonlyMap<string, readonly string[]> {
  const fields = new Map<string, readonly string[]>()
  for (const key of Object.keys(
    syntopicaScalarPathFields,
  ) as (keyof typeof syntopicaScalarPathFields)[])
    fields.set(syntopicaScalarPathFields[key], [paths[key]])
  fields.set('brain.pages', paths.pages)
  fields.set('projects.roots', paths.projectRoots)
  fields.set('clips.inbox', inbox === null ? [] : [inbox])
  fields.set('sessions.desktopRoots', desktopRoots)
  return fields
}
