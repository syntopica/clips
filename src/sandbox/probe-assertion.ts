import type { ProbePaths } from './probe-paths.ts'

export type ProbeAssertion = {
  id: string
  description: string
  expected: 'succeeded' | 'denied'
  command: (paths: ProbePaths) => string[]
  /**
   * What this specific command's denial looks like, or null for a row that is
   * expected to succeed.
   *
   * Per-assertion rather than one shared list, because a shared list credits
   * any refusal anywhere in stderr as evidence for the row: the network probe
   * once read as denied while the network was fully open, because a component
   * it invoked failed to read a config file and wrote "Operation not
   * permitted" before a socket was ever opened.
   */
  denialSignature: RegExp | null
}
