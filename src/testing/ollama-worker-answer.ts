import type { WorkerInferenceAnswer } from '../worker-synthesis/worker-inference-answer.ts'

/** A worker answer carrying `json`, as the local Ollama backend reports it. */
export const ollamaWorkerAnswer = (json: unknown): WorkerInferenceAnswer => ({
  text: JSON.stringify(json),
  executor: { node: 'n', provider: 'ollama', model: 'qwen3.6:35b' },
})
