export type InstanceCommit =
  | { kind: 'route'; clipId: string; code: string }
  | { kind: 'publish' | 'requeue' | 'process'; clipId: string }
  | { kind: 'process-cited' | 'reconcile-cited'; clipIds: readonly string[] }
  | { kind: 'reject'; clipId: string; count: number }
  | { kind: 'harvest' }
  | { kind: 'export-chatgpt'; count: number }
