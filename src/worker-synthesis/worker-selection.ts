/** The selection pass's answer: which existing pages the clip belongs in. */
export type WorkerSelection = {
  pages: string[]
  needs_claude: boolean
  reason: string
}
