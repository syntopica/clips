import type { WorkerInferenceAnswer } from './worker-inference-answer.ts'

/** The process boundary of worker synthesis, injected so the synthesizer is
 * testable without a coordinator.
 *
 * `step` names the pass and keys the job; `reserveBytes` is room the answer
 * needs inside the model's window beyond the prompt itself, which the writing
 * pass sets to the size of the pages it asks to have rewritten.
 *
 * `excluding` is the same port with worker executor providers that must never
 * run its jobs; an empty list is the port as it is, and a coordinator that
 * predates the field ignores it, so the caller still checks who answered. */
export type WorkerSynthesisPort = {
  infer(
    step: 'select' | 'write' | 'review',
    prompt: string,
    schema: Record<string, unknown>,
    reserveBytes: number,
  ): Promise<WorkerInferenceAnswer>
  excluding(providers: readonly string[]): WorkerSynthesisPort
}
