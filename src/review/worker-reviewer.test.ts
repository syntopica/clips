import { describe, expect, it } from 'vitest'
import { INTERACTIVE_MODEL } from '../synthesis/interactive-model.ts'
import type { WorkerInferenceAnswer } from '../worker-synthesis/worker-inference-answer.ts'
import type { WorkerSynthesisPort } from '../worker-synthesis/worker-synthesis-port.ts'
import { workerReviewer } from './worker-reviewer.ts'

const DIFF = [
  'diff --git a/brain/topics/x.md b/brain/topics/x.md',
  '--- a/brain/topics/x.md',
  '+++ b/brain/topics/x.md',
  '+A new line.',
].join('\n')

const APPLY_TEXT = '{"verdict":"apply","reason":"sound"}'
const OPENROUTER_AUTHOR = 'worker:openrouter/qwen/qwen3.8-27b'

const answering = (
  answer: WorkerInferenceAnswer,
): WorkerSynthesisPort & {
  prompts: string[]
  excluded: (readonly string[])[]
} => {
  const prompts: string[] = []
  const excluded: (readonly string[])[] = []
  const portExcluding = (
    providers: readonly string[],
  ): WorkerSynthesisPort => ({
    infer: async (_step, prompt) => {
      prompts.push(prompt)
      excluded.push(providers)
      return Promise.resolve(answer)
    },
    excluding: portExcluding,
  })
  return Object.assign(portExcluding([]), { prompts, excluded })
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
      text: APPLY_TEXT,
      executor: { provider: 'ollama', model: 'qwen3.6:35b' },
    })

    const outcome = await review(port, OPENROUTER_AUTHOR)

    expect(outcome.verdict).toBe('apply')
    expect(port.prompts[0]).toContain('+A new line.')
  })

  it('escalates a verdict from the tier that wrote the diff', async () => {
    // OpenRouter reports whichever fallback answered, so two names on one
    // tier are not evidence of two independent models.
    const port = answering({
      text: APPLY_TEXT,
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
      text: APPLY_TEXT,
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

  it.each([
    ['worker:openrouter/qwen/qwen3.8-27b:free', ['openrouter']],
    ['worker:agy/gemini-3-flash', ['agy']],
    ['worker:ollama/qwen3.6:35b', ['ollama', 'local-cpu']],
    ['worker:codex/gpt', ['codex']],
  ])(
    'asks the worker to leave out the providers of the author %s',
    async (author, providers) => {
      const port = answering({ failure: 'stop here' })

      await review(port, author)

      expect(port.excluded).toEqual([providers])
    },
  )

  it('excludes nothing for an interactive author, which no grading tier shares', async () => {
    const port = answering({ failure: 'stop here' })

    await review(port, INTERACTIVE_MODEL)

    expect(port.excluded).toEqual([[]])
  })

  it('excludes every provider for an author it cannot place', async () => {
    const port = answering({ failure: 'stop here' })

    await review(port, 'worker:unreported')

    expect(port.excluded[0]).toEqual(
      expect.arrayContaining([
        'ollama',
        'openrouter',
        'codex',
        'cursor',
        'agy',
      ]),
    )
  })

  it('escalates the worker failing a job its exclusion left without an executor', async () => {
    const port = answering({
      failure:
        'worker job j-1 on q.review had no eligible executor once openrouter excluded (no_eligible_executor)',
    })

    const outcome = await review(port, OPENROUTER_AUTHOR)

    expect(outcome.verdict).toBe('claude')
    expect(outcome.reason).toContain('no_eligible_executor')
  })

  it('still refuses a verdict from the author tier when an old worker ignored the exclusion', async () => {
    const port = answering({
      text: APPLY_TEXT,
      executor: { provider: 'openrouter', model: 'qwen/qwen3.8-27b' },
    })

    const outcome = await review(port, OPENROUTER_AUTHOR)

    expect(port.excluded).toEqual([['openrouter']])
    expect(outcome.verdict).toBe('claude')
    expect(outcome.reason).toContain('openrouter tier')
  })
})
