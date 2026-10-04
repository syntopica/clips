import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { EXIT_CODE } from '../cli/exit-code.ts'
import { structuredFailure } from '../reconcile/structured-failure.ts'
import { recordClipRun } from '../runs/record-clip-run.ts'
import { clipTestMetadata } from '../testing/clip-test-metadata.ts'
import { clipTestState } from '../testing/clip-test-state.ts'
import { git } from '../testing/git.ts'
import { initGitRepo } from '../testing/init-git-repo.ts'
import { temporaryDir } from '../testing/temporary-dir.ts'
import type { StatusDocument } from './status-document.ts'
import { statusJson } from './status-json.ts'

const TITLE = 'Distinctive synthetic title 7731'
const URL = 'https://example.test/distinctive-article-7731'
const FAILURE_MESSAGE = 'the model quoted the distinctive synthetic body 7731'
const PENDING_ID = '01KYFX6NFRDVW03ZFJXQ6W1VVG'
const DONE_ID = '01KYFX6NFRDVW03ZFJXQ6W1VVJ'

const writeClip = (
  store: string,
  bucket: string,
  [clipId, clippedAt]: [string, string],
  state: Record<string, unknown>,
): void => {
  const directory = join(store, 'clips', bucket, '2026', '07', clipId)
  mkdirSync(directory, { recursive: true })
  const metadata = {
    ...clipTestMetadata,
    clip_id: clipId,
    title: TITLE,
    url: URL,
  }
  writeFileSync(
    join(directory, 'metadata.json'),
    JSON.stringify({ ...metadata, normalized_url: URL, clipped_at: clippedAt }),
  )
  writeFileSync(join(directory, 'state.json'), JSON.stringify(state))
  writeFileSync(join(directory, 'index.md'), `# ${TITLE}\n`)
}

const fixture = async (): Promise<{
  brain: string
  store: string
  head: string
}> => {
  const brain = temporaryDir('status-items-brain-')
  initGitRepo(brain)
  writeFileSync(join(brain, 'index.md'), '# brain\n')
  git(brain, 'add', '.')
  git(brain, 'commit', '-qm', 'init')
  const head = git(brain, 'rev-parse', 'HEAD')
  const store = temporaryDir('status-items-store-')
  writeClip(
    store,
    'pending',
    [PENDING_ID, '2026-07-29T08:00:00Z'],
    clipTestState,
  )
  writeClip(
    store,
    'needs-claude',
    ['01KYFX6NFRDVW03ZFJXQ6W1VVN', '2026-06-01T08:00:00Z'],
    {
      status: 'needs-claude',
      updatedAt: '2026-07-02T09:00:00Z',
      failure: structuredFailure(
        'synthesis',
        'MODEL_ESCALATED',
        FAILURE_MESSAGE,
        false,
      ),
      brainCommit: null,
    },
  )
  writeClip(store, 'processed', [DONE_ID, '2026-07-30T01:00:00Z'], {
    ...clipTestState,
    status: 'processed',
    brainCommit: head,
  })
  mkdirSync(join(store, 'clips', 'pending', '2026', '07', '2026-07-28-mobile'))
  mkdirSync(join(brain, '.ingest', 'clips'), { recursive: true })
  writeFileSync(
    join(brain, '.ingest', 'clips', `${DONE_ID}.json`),
    JSON.stringify({
      schemaVersion: 1,
      clipId: DONE_ID,
      clipFormatVersion: 1,
      contentSha256: 'a'.repeat(64),
      clipRepoCommit: 'b'.repeat(40),
      clipSourcePath: 'clips/pending/2026/07/c',
      brainBaseCommit: 'c'.repeat(40),
      processedAt: '2026-07-30T03:00:00Z',
      reviewedAt: '2026-07-30T03:01:00Z',
      pagesTouched: ['topics/placeholder-page.md'],
      synthesizer: {
        model: 'none',
        promptSha256: 'd'.repeat(64),
        toolVersion: '0.1.0',
        boundary: 'none',
      },
    }),
  )
  await recordClipRun(brain, PENDING_ID, {
    startedAt: '2026-07-29T09:00:00.000Z',
    durationMs: 93_000,
    outcome: 'escalated',
    model: 'worker:ollama/m',
    boundary: 'worker-inference',
    workerJobIds: ['job-synthetic-1', 'job-synthetic-2'],
    usage: null,
  })
  return { brain, store, head }
}

describe('clips status --json --items', () => {
  it('lists each clip by code, time and count, and nothing that identifies it', async () => {
    const { brain, store, head } = await fixture()
    const written: string[] = []
    const spy = vi.spyOn(process.stdout, 'write').mockImplementation(((
      chunk: string,
    ): boolean => {
      written.push(chunk)
      return true
    }) as typeof process.stdout.write)
    try {
      expect(
        await statusJson(brain, store, new Date('2026-07-30T12:00:00Z'), true),
      ).toBe(EXIT_CODE.success)
    } finally {
      spy.mockRestore()
    }
    const stdout = written.join('')
    const items = (JSON.parse(stdout) as StatusDocument).items ?? []

    expect(items.map((item) => item.state)).toEqual([
      'needs-claude',
      'pending',
      'unreadable',
      'reconciled',
    ])
    expect(items[0]).toMatchObject({
      reason: 'routed_needs_claude',
      failure: { stage: 'synthesis', code: 'MODEL_ESCALATED' },
      stage: 'operator',
      capturedAt: '2026-06-01T08:00:00.000Z',
      lastTransitionAt: '2026-07-02T09:00:00.000Z',
      attempts: 0,
      lastRun: null,
      pages: [],
    })
    expect(items[1]).toMatchObject({
      reason: 'no_ledger',
      stage: 'synthesis',
      attempts: 1,
      lastRun: {
        durationMs: 93_000,
        workerJobIds: ['job-synthetic-1', 'job-synthetic-2'],
      },
    })
    expect(items[2]).toMatchObject({ reason: 'thin_clip', stage: 'capture' })
    expect(items[3]).toMatchObject({
      reason: 'reconciled',
      stage: 'done',
      pages: ['topics/placeholder-page.md'],
    })
    for (const item of items) expect(item.id).toMatch(/^[0-9a-f]{16}$/)
    expect(new Set(items.map((item) => item.id)).size).toBe(items.length)
    for (const forbidden of [
      TITLE,
      URL,
      'example.test',
      '01KYFX6N',
      'mobile',
      head,
      FAILURE_MESSAGE,
    ])
      expect(stdout).not.toContain(forbidden)
  })
})
