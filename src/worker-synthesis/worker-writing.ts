import type { WorkerPageWrite } from './worker-page-write.ts'

/** The writing pass's answer: the pages it wrote and its verdict. */
export type WorkerWriting = {
  pages: WorkerPageWrite[]
  needs_claude: boolean
  reason: string
}
