export type SyntopicaConfig = {
  readonly configuredPaths: readonly string[]
  readonly statePaths: readonly string[]
  readonly dataRoot: string
  readonly schemaVersion: number
  readonly instanceId: string
  readonly pages: readonly string[]
  readonly sources: string
  readonly index: string
  readonly ledger: string
  readonly archive: string
  readonly inbox: string | null
  readonly inboxRepositoryUrl: string | null
  readonly screeningScope: string
  readonly desktopRoots: readonly string[]
  readonly atriumPath: string
  readonly conversationsPath: string
  readonly brainPath: string
  readonly clipsPath: string
  readonly brainApiVersion: number
  readonly clipsApiVersion: number
  readonly captureOrigin: string | null
  readonly captureMirror: boolean
  readonly runners: Readonly<Record<string, string | null>>
  readonly browser: string | null
  readonly newsletterAcceptedSenders: string
  readonly newsletterRejectedSenders: string
  readonly newsletterRejectedBookingSenders: string
  readonly triageProfile: string
  readonly triageTopics: readonly string[]
  readonly projectAliases: string
  readonly projectRoots: readonly string[]
}
