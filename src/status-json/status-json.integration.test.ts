import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { EXIT_CODE } from '../cli/exit-code.ts'
import { captureStderr } from '../testing/capture-stderr.ts'
import { clipTestMetadata } from '../testing/clip-test-metadata.ts'
import { clipTestState } from '../testing/clip-test-state.ts'
import { git } from '../testing/git.ts'
import { initGitRepo } from '../testing/init-git-repo.ts'
import { temporaryDir } from '../testing/temporary-dir.ts'
import type { StatusDocument } from './status-document.ts'
import { statusJson } from './status-json.ts'

const TITLE = 'Distinctive synthetic title 5521'
const URL = 'https://example.test/distinctive-article-5521'
const now = new Date('2026-07-30T12:00:00.000Z')

const newBrain = (): { brain: string; head: string } => {
  const brain = temporaryDir('status-json-brain-')
  initGitRepo(brain)
  writeFileSync(join(brain, 'index.md'), '# brain\n')
  git(brain, 'add', '.')
  git(brain, 'commit', '-qm', 'init')
  return { brain, head: git(brain, 'rev-parse', 'HEAD') }
}

const writeClip = (
  store: string,
  bucket: string,
  name: string,
  files: Record<string, unknown>,
): void => {
  const directory = join(store, 'clips', bucket, '2026', '07', name)
  mkdirSync(directory, { recursive: true })
  for (const [file, body] of Object.entries(files))
    writeFileSync(
      join(directory, file),
      typeof body === 'string' ? body : JSON.stringify(body),
    )
}

const clipFiles = (
  clipId: string,
  clippedAt: string,
  state: Record<string, unknown>,
): Record<string, unknown> => ({
  'metadata.json': {
    ...clipTestMetadata,
    clip_id: clipId,
    title: TITLE,
    url: URL,
    normalized_url: URL,
    clipped_at: clippedAt,
  },
  'state.json': state,
  'index.md': `# ${TITLE}\n`,
})

const newStore = (head: string): string => {
  const store = temporaryDir('status-json-store-')
  writeClip(
    store,
    'pending',
    'a',
    clipFiles(
      '01KYFX6NFRDVW03ZFJXQ6W1VVG',
      '2026-07-29T08:00:00Z',
      clipTestState,
    ),
  )
  writeClip(
    store,
    'pending',
    'b',
    clipFiles(
      '01KYFX6NFRDVW03ZFJXQ6W1VVH',
      '2026-07-01T08:00:00Z',
      clipTestState,
    ),
  )
  for (const [name, clipId, commit] of [
    ['c', '01KYFX6NFRDVW03ZFJXQ6W1VVJ', head],
    ['d', '01KYFX6NFRDVW03ZFJXQ6W1VVK', head.slice(0, 7)],
  ] as const) {
    writeClip(
      store,
      'processed',
      name,
      clipFiles(clipId, '2026-07-30T01:00:00Z', {
        ...clipTestState,
        status: 'processed',
        brainCommit: commit,
      }),
    )
  }
  writeClip(store, 'pending', '2026-07-28-mobile', {
    'index.md': '---\nschema_version: 2\n---\n',
  })
  return store
}

const runStatusJson = async (
  brain: string,
  store: string,
): Promise<{ exitCode: number; stdout: string }> => {
  const written: string[] = []
  const spy = vi.spyOn(process.stdout, 'write').mockImplementation(((
    chunk: string,
  ): boolean => {
    written.push(chunk)
    return true
  }) as typeof process.stdout.write)
  try {
    return {
      exitCode: await statusJson(brain, store, now),
      stdout: written.join(''),
    }
  } finally {
    spy.mockRestore()
  }
}

describe('clips status --json', () => {
  it('prints counts and capture times, and nothing that identifies a clip', async () => {
    const { brain, head } = newBrain()
    const { exitCode, stdout } = await runStatusJson(brain, newStore(head))
    expect(exitCode).toBe(EXIT_CODE.success)
    expect(stdout.trimEnd()).not.toContain('\n')
    const document = JSON.parse(stdout) as StatusDocument
    expect(document.schemaVersion).toBe(1)
    expect(document.total).toBe(5)
    expect(document.states).toMatchObject({
      pending: 2,
      reconciled: 2,
      unreadable: 1,
      inconsistent: 0,
    })
    expect(document.oldestAt.pending).toBe('2026-07-01T08:00:00.000Z')
    expect(document.oldestAt.unreadable).toBeNull()
    expect(document.intake.undated).toBe(1)
    expect(document.intake.days.at(-1)).toEqual({
      day: '2026-07-30',
      count: 2,
    })
    for (const forbidden of [
      TITLE,
      URL,
      'example.test',
      '01KYFX6N',
      'mobile',
      head,
    ])
      expect(stdout).not.toContain(forbidden)
  })

  it('exits 2 when a clip is inconsistent, still printing the document', async () => {
    const { brain, head } = newBrain()
    const store = newStore(head)
    writeClip(
      store,
      'processed',
      'e',
      clipFiles('01KYFX6NFRDVW03ZFJXQ6W1VVM', '2026-07-30T02:00:00Z', {
        ...clipTestState,
        status: 'processed',
        brainCommit: 'deadbeefdeadbeef',
      }),
    )
    const { exitCode, stdout } = await runStatusJson(brain, store)
    expect(exitCode).toBe(EXIT_CODE.clipsStopped)
    expect((JSON.parse(stdout) as StatusDocument).states.inconsistent).toBe(1)
    expect(stdout).not.toContain('deadbeef')
  })

  it('reports a clips repository that was never pulled, without a document', async () => {
    const { brain } = newBrain()
    const missing = join(temporaryDir('status-json-missing-'), 'never-pulled')
    const { exitCode, stderr } = await captureStderr(async () =>
      statusJson(brain, missing, now),
    )
    expect(exitCode).toBe(EXIT_CODE.fatalLocal)
    expect(stderr).toContain('clips pull')
  })
})
