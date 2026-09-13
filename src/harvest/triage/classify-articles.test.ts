import { describe, expect, it } from 'vitest'
import { harvestedArticles } from '../../testing/harvested-articles.ts'
import { classifyArticles } from './classify-articles.ts'
import { TRIAGE_BATCH_SIZE } from './triage-batch-size.ts'
import type { TriageRunner } from './triage-runner.ts'

const verdicts = (ids: number[], bucket = 'ingest'): string =>
  JSON.stringify({
    verdicts: ids.map((id) => ({
      id,
      bucket,
      topic: 'ai-agents',
      reason: 'why',
    })),
  })

const runner = (responses: (string | null)[]): TriageRunner => {
  let call = 0
  return {
    run: async () => {
      const response = responses[call] ?? null
      call += 1
      return Promise.resolve(response)
    },
  }
}

describe('classifyArticles', () => {
  it('joins each verdict back to its article', async () => {
    const result = await classifyArticles(
      harvestedArticles(2),
      runner([verdicts([0, 1])]),
      null,
    )

    expect(result[0]?.title).toBe('Title 0')
    expect(result[0]?.bucket).toBe('ingest')
    expect(result[1]?.reason).toBe('why')
  })

  it('sends a dead batch to review rather than losing or rejecting it', async () => {
    const result = await classifyArticles(
      harvestedArticles(2),
      runner([null]),
      null,
    )

    expect(result.map((article) => article.bucket)).toEqual([
      'review',
      'review',
    ])
    expect(result[0]?.reason).toBe('no verdict returned by the classifier')
  })

  it('reviews the ids a batch skipped, keeping the ones it returned', async () => {
    const result = await classifyArticles(
      harvestedArticles(3),
      runner([verdicts([0, 2])]),
      null,
    )

    expect(result.map((article) => article.bucket)).toEqual([
      'ingest',
      'review',
      'ingest',
    ])
  })

  it('survives unparseable output', async () => {
    const result = await classifyArticles(
      harvestedArticles(1),
      runner(['not json at all']),
      null,
    )

    expect(result[0]?.bucket).toBe('review')
  })

  it('drops a verdict for an id outside the article range', async () => {
    const result = await classifyArticles(
      harvestedArticles(1),
      runner([verdicts([0, 9999])]),
      null,
    )

    expect(result).toHaveLength(1)
    expect(result[0]?.bucket).toBe('ingest')
  })

  it('runs one batch per chunk and keeps later batches numbered correctly', async () => {
    const total = TRIAGE_BATCH_SIZE + 1
    const calls: string[] = []
    const result = await classifyArticles(
      harvestedArticles(total),
      {
        run: async (batch) => {
          calls.push(batch)
          return Promise.resolve(verdicts([TRIAGE_BATCH_SIZE]))
        },
      },
      null,
    )

    expect(calls).toHaveLength(2)
    expect(result[TRIAGE_BATCH_SIZE]?.bucket).toBe('ingest')
    expect(result[0]?.bucket).toBe('review')
  })

  it('refines only the verdicts the bulk pass left in review', async () => {
    const refined: string[] = []
    const result = await classifyArticles(
      harvestedArticles(3),
      runner([verdicts([0, 2], 'rejected')]),
      {
        run: async (batch) => {
          refined.push(batch)
          return Promise.resolve(verdicts([1]))
        },
      },
    )

    expect(refined).toHaveLength(1)
    expect(refined[0]?.split('\n')).toHaveLength(1)
    expect(refined[0]?.startsWith('1\t')).toBe(true)
    expect(result.map((article) => article.bucket)).toEqual([
      'rejected',
      'ingest',
      'rejected',
    ])
  })

  it('never lets the refiner overwrite a verdict it was not given', async () => {
    const result = await classifyArticles(
      harvestedArticles(2),
      runner([verdicts([0], 'rejected')]),
      runner([verdicts([0, 1])]),
    )

    expect(result.map((article) => article.bucket)).toEqual([
      'rejected',
      'ingest',
    ])
  })

  it('does not call the refiner when nothing came back for review', async () => {
    let called = false
    const result = await classifyArticles(
      harvestedArticles(2),
      runner([verdicts([0, 1])]),
      {
        run: async () => {
          called = true
          return Promise.resolve(null)
        },
      },
    )

    expect(called).toBe(false)
    expect(result.map((article) => article.bucket)).toEqual([
      'ingest',
      'ingest',
    ])
  })
})
