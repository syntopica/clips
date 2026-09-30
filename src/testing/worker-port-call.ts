/** One inference a fake worker synthesis port was asked for. */
export type WorkerPortCall = {
  step: string
  prompt: string
  reserveBytes: number
}
