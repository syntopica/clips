import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { Clip } from '../clips/clip.ts'
import { gradePage } from './grade-page.ts'
import type { GradeRunner } from './grade-runner.ts'

const CLIP_DIRECTORY = '/store/one'
const CITED_URL = 'https://medium.com/@a/one-000000000001'

const clip = (directory: string, normalizedUrl: string): Clip =>
  ({
    kind: 'clip',
    directory,
    bucket: 'pending',
    metadata: { normalized_url: normalizedUrl },
    state: { status: 'pending' },
  }) as Clip

const page = [
  '---',
  'title: A page',
  'sources:',
  '  - https://medium.com/@a/one-000000000001',
  '---',
  '',
  'Body.',
].join('\n')

const runnerReturning = (lastMessage: string | null): GradeRunner => ({
  evidenceCeilingBytes: 2 * 1024 * 1024,
  run: async () =>
    Promise.resolve({ exitCode: 0, lastMessage, stderrTail: '' }),
})

const withPage = async (): Promise<string> => {
  const brain = await mkdtemp(join(tmpdir(), 'grade-page-'))
  await writeFile(join(brain, 'a.md'), page)
  return brain
}

describe('gradePage', () => {
  it('grades against the clips the page cites', async () => {
    const brain = await withPage()
    const clips = [clip(CLIP_DIRECTORY, CITED_URL)]

    expect(
      await gradePage(
        brain,
        'a.md',
        clips,
        runnerReturning(
          JSON.stringify({
            unsupported: [{ claim: 'x', why: 'y' }],
            uncheckable: [],
            misattributed: [],
            summary: 'One.',
            verdict: 'unsupported',
          }),
        ),
      ),
    ).toEqual({
      page: 'a.md',
      citedUrls: 1,
      evidenceClips: 1,
      result: {
        unsupported: [{ claim: 'x', why: 'y' }],
        uncheckable: [],
        misattributed: [],
        summary: 'One.',
        verdict: 'unsupported',
      },
      failure: null,
      exempt: false,
    })
  })

  it('returns an exempt page without spending a run on it', async () => {
    const brain = await mkdtemp(join(tmpdir(), 'grade-page-'))
    await writeFile(
      join(brain, 'a.md'),
      page.replace('sources:', 'verification: exempt\nsources:'),
    )
    const exploding: GradeRunner = {
      evidenceCeilingBytes: 2 * 1024 * 1024,
      run: () => {
        throw new Error('the runner must not be reached for an exempt page')
      },
    }

    expect(
      await gradePage(
        brain,
        'a.md',
        [clip(CLIP_DIRECTORY, CITED_URL)],
        exploding,
      ),
    ).toEqual({
      page: 'a.md',
      citedUrls: 0,
      evidenceClips: 0,
      result: null,
      failure: null,
      exempt: true,
    })
  })

  it('reports a missing page rather than throwing', async () => {
    const brain = await withPage()

    expect(
      (await gradePage(brain, 'gone.md', [], runnerReturning('{}'))).failure,
    ).toBe('page not found')
  })

  it('refuses to grade a page whose sources are not in the store', async () => {
    const brain = await withPage()

    expect(
      (await gradePage(brain, 'a.md', [], runnerReturning('{}'))).failure,
    ).toBe('no evidence on disk for any of its 1 cited sources')
  })

  it('treats an unreadable verdict as ungraded, not as clean', async () => {
    const brain = await withPage()
    const clips = [clip(CLIP_DIRECTORY, CITED_URL)]
    const graded = await gradePage(
      brain,
      'a.md',
      clips,
      runnerReturning('oops'),
    )

    expect(graded.result).toBeNull()
    expect(graded.failure).toBe('grader returned no readable verdict')
  })

  it('treats a self-contradicting grader as ungraded, not as clean', async () => {
    const brain = await withPage()
    const clips = [clip(CLIP_DIRECTORY, CITED_URL)]
    const graded = await gradePage(
      brain,
      'a.md',
      clips,
      runnerReturning(
        JSON.stringify({
          unsupported: [],
          uncheckable: [],
          misattributed: [],
          summary: 'The page states a number the source does not contain.',
          verdict: 'unsupported',
        }),
      ),
    )

    expect(graded.result).toBeNull()
    expect(graded.failure).toContain('listed no claim')
  })
})
