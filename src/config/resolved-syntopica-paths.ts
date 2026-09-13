import type { syntopicaScalarPathFields } from './syntopica-scalar-path-fields.ts'

export type ResolvedSyntopicaPaths = Readonly<
  Record<keyof typeof syntopicaScalarPathFields, string>
> & {
  readonly pages: readonly string[]
  readonly projectRoots: readonly string[]
}
