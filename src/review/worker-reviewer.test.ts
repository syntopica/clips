import { describe, expect, it } from 'vitest'
import type { WorkerInferenceAnswer } from '../worker-synthesis/worker-inference-answer.ts'
import type { WorkerSynthesisPort } from '../worker-synthesis/worker-synthesis-port.ts'
import { workerReviewer } from './worker-reviewer.ts'

const DIFF = [
  'diff --git a/brain/topics/x.md b/brain/topics/x.md',
  '--- a/brain/topics/x.md',
  '+++ b/brain/topics/x.md',
  '+A new line.',
].join('\n')

const answering = (
  answer: WorkerInferenceAnswer,
): WorkerSynthesisPort & { prompts: string[] } => {
  const port = {
    prompts: [] as string[],
    infer: async (_step: string, prompt: string) => {
      port.prompts.push(prompt)
      return Promise.resolve(answer)
    },
  }
  return port
}

const review = async (port: WorkerSynthesisPort, authorModel: string) =>
  workerReviewer(port).review({
    summary: 'a summary',
    authorModel,
    clipId: '01M098Y2MEC0V8XXXXXXXXXXXX',
    fullDiff: async () => Promise.resolve(DIFF),
  })

describe('workerReviewer', () => {
  it('applies a diff another executor approved', async () => {
    const port = answering({
      text: '{"verdict":"apply","reason":"sound"}',
      executor: { provider: 'openrouter', model: 'nvidia/nemotron' },
    })

    const outcome = await review(port, 'worker:openrouter/qwen/qwen3.8-27b')

    expect(outcome.verdict).toBe('apply')
    expect(port.prompts[0]).toContain('+A new line.')
  })

  it('escalates a verdict from the executor that wrote the diff', async () => {
    const port = answering({
      text: '{"verdict":"apply","reason":"sound"}',
      executor: { provider: 'openrouter', model: 'qwen/qwen3.8-27b' },
    })

    const outcome = await review(port, 'worker:openrouter/qwen/qwen3.8-27b')

    expect(outcome.verdict).toBe('claude')
    expect(outcome.reason).toContain('wrote the diff')
  })

  it('escalates when the worker gave no answer', async () => {
    const port = answering({ failure: 'job ended without an answer' })

    const outcome = await review(port, 'worker:ollama/qwen3.6:35b')

    expect(outcome).toEqual({
      verdict: 'claude',
      reason: 'review: job ended without an answer',
    })
  })
})
