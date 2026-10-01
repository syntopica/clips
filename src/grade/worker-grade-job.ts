import { createHash } from 'node:crypto'
import { GRADE_OUTPUT_SCHEMA } from './grade-output-schema.ts'

/** The `inference` job one page is graded by on the worker's `clips.grade`
 * queue, whose executor ladder decides what answers it: agy first, then
 * OpenRouter's free models, then the local model once `local_after_s` passes.
 *
 * `internal`, as the task job it replaces was: the prompt is captured web
 * content and a wiki page outside the sensitive directories, which the grade
 * lane refuses before anything is built. `model` is the local model the
 * worker pins, which is also what the queue's OpenRouter route maps from. The
 * key is the model and the prompt, and the prompt carries every byte of the
 * page and its evidence, so an edited page never collects an old verdict. */
export const workerGradeJob = (
  model: string,
  prompt: string,
): Record<string, unknown> & { idempotency_key: string } => ({
  contract: 1,
  kind: 'inference',
  queue: 'clips.grade',
  idempotency_key: `grade:${createHash('sha256').update(`${model}\n${prompt}`).digest('hex')}`,
  priority: 40,
  privacy: 'internal',
  max_attempts: 2,
  requirements: { capability: 'chat.json', models: [model] },
  input: {
    messages: [{ role: 'user', content: prompt }],
    schema: GRADE_OUTPUT_SCHEMA,
    options: { temperature: 0 },
  },
})
