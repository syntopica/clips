import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { readLatestVerdicts } from './read-latest-verdicts.ts'

const URL_A = 'https://example.com/a'

const root = mkdtempSync(join(tmpdir(), 'clips-verdicts-'))
afterAll(() => {
  rmSync(root, { recursive: true, force: true })
})

const writeRun = (repository: string, run: string, rows: unknown[]): void => {
  const path = join(repository, 'classifications', run)
  mkdirSync(join(path, '..'), { recursive: true })
  writeFileSync(path, `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`)
}

const repositoryWith = (name: string, runs: [string, unknown[]][]): string => {
  const repository = join(root, name)
  for (const [run, rows] of runs) writeRun(repository, run, rows)
  return repository
}

describe('readLatestVerdicts', () => {
  it('is empty when the store does not exist', async () => {
    expect((await readLatestVerdicts(join(root, 'absent'))).size).toBe(0)
  })

  it('keys a verdict by both normalized_url and capture_id', async () => {
    const repository = repositoryWith('both-keys', [
      [
        '2026-07-29/run-zero.jsonl',
        [
          {
            capture_id: '01KYFX6NFRDVW03ZFJXQ6W1VVG',
            normalized_url: URL_A,
            bucket: 'ingest',
          },
        ],
      ],
    ])
    const verdicts = await readLatestVerdicts(repository)
    expect(verdicts.get(URL_A)?.bucket).toBe('ingest')
    expect(verdicts.get('01KYFX6NFRDVW03ZFJXQ6W1VVG')?.bucket).toBe('ingest')
  })

  it('lets the newest run win, ordering run directories lexicographically', async () => {
    const repository = repositoryWith('newest-wins', [
      [
        '2026-07-29/run-zero.jsonl',
        [{ normalized_url: URL_A, bucket: 'ingest' }],
      ],
      [
        '2026-07-30-fulltext/rejected.jsonl',
        [{ normalized_url: URL_A, bucket: 'rejected' }],
      ],
    ])
    const verdict = (await readLatestVerdicts(repository)).get(URL_A)
    expect(verdict?.bucket).toBe('rejected')
    expect(verdict?.run).toBe(join('2026-07-30-fulltext', 'rejected.jsonl'))
  })

  it('skips blank and unparseable lines instead of throwing', async () => {
    const repository = join(root, 'corrupt')
    const path = join(repository, 'classifications', '2026-07-29')
    mkdirSync(path, { recursive: true })
    writeFileSync(
      join(path, 'run.jsonl'),
      [
        '',
        'not json at all',
        '{"bucket": 7}',
        JSON.stringify({
          normalized_url: 'https://example.com/b',
          bucket: 'review',
        }),
      ].join('\n'),
    )
    const verdicts = await readLatestVerdicts(repository)
    expect(verdicts.size).toBe(1)
    expect(verdicts.get('https://example.com/b')?.bucket).toBe('review')
  })

  it('ignores files that are not .jsonl', async () => {
    const repository = join(root, 'other-files')
    const path = join(repository, 'classifications', '2026-07-29')
    mkdirSync(path, { recursive: true })
    writeFileSync(join(path, 'README.md'), 'notes about this run\n')
    expect((await readLatestVerdicts(repository)).size).toBe(0)
  })
})
