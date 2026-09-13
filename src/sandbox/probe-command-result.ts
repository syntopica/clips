export type ProbeCommandResult = {
  exitCode: number | null
  signal: string | null
  stdout: string
  stderr: string
  timedOut: boolean
}
