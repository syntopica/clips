import type { ClipRun } from '../runs/clip-run.ts'

export type StatusItemRead = {
  runs: readonly ClipRun[]
  rejections: number
  pages: string[]
}
