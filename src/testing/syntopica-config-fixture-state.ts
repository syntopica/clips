export type SyntopicaConfigFixtureState = {
  root: string
  data: string
  document: Record<string, unknown>
  schema: Record<string, unknown>
  origins: Map<string, string>
}
