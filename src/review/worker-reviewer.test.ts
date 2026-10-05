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
  it('applies a diff an executor on another tier approved', async () => {
    const port = answering({
      text: '{"verdict":"apply","reason":"sound"}',
      executor: { provider: 'ollama', model: 'qwen3.6:35b' },
    })

    const outcome = await review(port, 'worker:openrouter/qwen/qwen3.8-27b')

    expect(outcome.verdict).toBe('apply')
    expect(port.prompts[0]).toContain('+A new line.')
  })

  it('escalates a verdict from the tier that wrote the diff', async () => {
    // OpenRouter reports whichever fallback answered, so two names on one
    // tier are not evidence of two independent models.
    const port = answering({
      text: '{"verdict":"apply","reason":"sound"}',
      executor: { provider: 'openrouter', model: 'qwen/qwen3.8-27b' },
    })

    const outcome = await review(
      port,
      'worker:openrouter/qwen/qwen3.8-27b:free',
    )

    expect(outcome.verdict).toBe('claude')
    expect(outcome.reason).toContain('openrouter tier')
  })

  it('escalates every verdict on a diff whose author is unreported', async () => {
    const port = answering({
      text: '{"verdict":"apply","reason":"sound"}',
      executor: { provider: 'ollama', model: 'qwen3.6:35b' },
    })

    const outcome = await review(port, 'worker:unreported')

    expect(outcome.verdict).toBe('claude')
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
