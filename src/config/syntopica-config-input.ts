export type SyntopicaConfigInput = {
  readonly document: Record<string, unknown>
  readonly origins: ReadonlyMap<string, string>
  readonly root: string
  readonly environ: NodeJS.ProcessEnv
  readonly schema: Record<string, unknown>
}
