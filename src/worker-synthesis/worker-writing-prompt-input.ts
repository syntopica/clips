import type { WorkerShownPage } from './worker-shown-page.ts'

export type WorkerWritingPromptInput = {
  clipText: string
  shown: readonly WorkerShownPage[]
  pagePaths: readonly string[]
  directories: readonly string[]
  today: string
  guidance: string
}
