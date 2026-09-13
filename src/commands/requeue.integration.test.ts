import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { EXIT_CODE } from '../cli/exit-code.ts'
import { structuredFailure } from '../reconcile/structured-failure.ts'
import { clipTestMetadata } from '../testing/clip-test-metadata.ts'
import { git } from '../testing/git.ts'
import { temporaryDir } from '../testing/temporary-dir.ts'
import { requeue } from './requeue.ts'

const CLIP_ID = '01KYFX6NFRDVW03ZFJXQ6W1VVG'
const CLIP_NAME = '2026-07-26-example-com-t-01kyfx6n'
const NEEDS_CLAUDE = 'needs-claude'
const PENDING = 'pending'
const STATE_JSON = 'state.json'

const metadata = {
  ...clipTestMetadata,
  clip_id: CLIP_ID,
  title: 'Selection - Web APIs | MDN',
}

const newBrain = (): string => {
  const brain = temporaryDir('requeue-brain-')
  execFileSync('git', ['init', '-q', '-b', 'main', brain])
  return brain
}

/** A clips repository with a real bare origin, because requeue pushes. */
const newStore = (failure: string): string => {
  const origin = temporaryDir('requeue-origin-')
  execFileSync('git', ['init', '-q', '--bare', '-b', 'main', origin])
  const store = temporaryDir('requeue-store-')
  execFileSync('git', ['init', '-q', '-b', 'main', store])
  git(store, 'config', 'user.email', 'test@example.com')
  git(store, 'config', 'user.name', 'Test')
  const directory = join(store, 'clips', NEEDS_CLAUDE, '2026', '07', CLIP_NAME)
  mkdirSync(directory, { recursive: true })
  writeFileSync(join(directory, 'metadata.json'), JSON.stringify(metadata))
  writeFileSync(
    join(directory, STATE_JSON),
    JSON.stringify({
      status: NEEDS_CLAUDE,
      updatedAt: '2026-07-26T19:07:35Z',
      failure,
      brainCommit: null,
    }),
  )
  writeFileSync(join(directory, 'index.md'), '# t\n')
  git(store, 'add', '.')
  git(store, 'commit', '-qm', 'init')
  git(store, 'remote', 'add', 'origin', origin)
  git(store, 'push', '-q', '-u', 'origin', 'main')
  return store
}

const run = async (
  brain: string,
  store: string,
  filter: string | null,
): Promise<{ exitCode: number; output: string }> => {
  const written: string[] = []
  const capture = ((chunk: string): boolean => {
    written.push(chunk)
    return true
  }) as typeof process.stdout.write
  const out = vi.spyOn(process.stdout, 'write').mockImplementation(capture)
  const err = vi.spyOn(process.stderr, 'write').mockImplementation(capture)
  try {
    return {
      exitCode: await requeue(brain, store, filter),
      output: written.join(''),
    }
  } finally {
    out.mockRestore()
    err.mockRestore()
  }
}

const modelEscalated = structuredFailure(
  'synthesis',
  'MODEL_ESCALATED',
  'agy exited 1',
  false,
)

describe('requeue', () => {
  it('moves a transport-failed clip back to pending and pushes it', async () => {
    const store = newStore(modelEscalated)
    const result = await run(newBrain(), store, CLIP_ID)

    expect(result.exitCode).toBe(EXIT_CODE.success)
    expect(result.output).toContain('requeued to pending')

    // The move landed in the commit, not just in the worktree. This is the
    // half a hand-run `git mv` gets wrong: it stages the rename but keeps the
    // OLD blob for a file modified in the worktree, so the pushed clip would
    // still claim needs-claude.
    const committed = git(
      store,
      'show',
      `HEAD:clips/pending/2026/07/${CLIP_NAME}/${STATE_JSON}`,
    )
    expect(JSON.parse(committed)).toMatchObject({
      status: PENDING,
      failure: null,
    })
    expect(git(store, 'status', '--short')).toBe('')
    expect(git(store, 'rev-parse', 'HEAD')).toBe(
      git(store, 'rev-parse', 'origin/main'),
    )
  })

  it('leaves the clip alone when the failure is not a transport failure', async () => {
    const store = newStore(
      structuredFailure(
        'routing',
        'ROUTED_SENSITIVE',
        'example.com is sensitive',
        false,
      ),
    )
    const before = git(store, 'rev-parse', 'HEAD')
    const result = await run(newBrain(), store, CLIP_ID)

    expect(result.exitCode).toBe(EXIT_CODE.fatalLocal)
    expect(result.output).toContain('ROUTED_SENSITIVE')
    expect(git(store, 'rev-parse', 'HEAD')).toBe(before)
    const state = readFileSync(
      join(store, 'clips', NEEDS_CLAUDE, '2026', '07', CLIP_NAME, STATE_JSON),
      'utf8',
    )
    expect(JSON.parse(state)).toMatchObject({ status: NEEDS_CLAUDE })
  })

  it('needs a --clip, since there is no batch form of this', async () => {
    const result = await run(newBrain(), newStore(modelEscalated), null)
    expect(result.exitCode).toBe(EXIT_CODE.fatalLocal)
    expect(result.output).toContain('--clip')
  })

  it('reports a filter that matches nothing and commits nothing', async () => {
    const store = newStore(modelEscalated)
    const before = git(store, 'rev-parse', 'HEAD')
    const result = await run(newBrain(), store, '01ZZZZZZ')
    expect(result.exitCode).toBe(EXIT_CODE.fatalLocal)
    expect(git(store, 'rev-parse', 'HEAD')).toBe(before)
  })
})
