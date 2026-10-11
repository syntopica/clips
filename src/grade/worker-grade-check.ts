export type WorkerGradeCheck = {
  forbidden: readonly string[] | null
  promptBytes: number
  dataRoot: string
  model: string
}
