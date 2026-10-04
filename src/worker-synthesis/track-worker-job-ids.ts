import type { WorkerSynthesisPort } from './worker-synthesis-port.ts'

/** A port that passes every call through and keeps the id of each job it
 * submitted, in order, for one synthesis run. */
export const trackWorkerJobIds = (
  port: WorkerSynthesisPort,
): { port: WorkerSynthesisPort; jobIds: string[] } => {
  const jobIds: string[] = []
  return {
    jobIds,
    port: {
      infer: async (step, prompt, schema, reserveBytes) => {
        const answer = await port.infer(step, prompt, schema, reserveBytes)
        if (answer.jobId !== undefined) jobIds.push(answer.jobId)
        return answer
      },
    },
  }
}
