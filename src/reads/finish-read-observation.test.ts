import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { beginReadObservation } from './begin-read-observation.ts'
import { finishReadObservation } from './finish-read-observation.ts'
import { READ_PROBE_PAGE } from './read-probe-page.ts'

/** A worktree-shaped directory: the probe file, the root map, and two pages.
 * Real files rather than mocks, because what is under test is whether this
 * filesystem records a read - a mock would assert the assumption instead. */
const wikiFixture = async (): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), 'reads-'))
  await writeFile(join(root, READ_PROBE_PAGE), 'probe\n')
  await writeFile(join(root, 'index.md'), 'map\n')
  await mkdir(join(root, 'topics'), { recursive: true })
  await writeFile(join(root, 'topics', 'opened.md'), 'one\n')
  await writeFile(join(root, 'topics', 'ignored.md'), 'two\n')
  return root
}

describe('finishReadObservation', () => {
  it('reports unobservable when the probe found no access-time updates', async () => {
    expect(await finishReadObservation('/nowhere', { observable: false })).toBe(
      'unobservable',
    )
  })

  it('reports an empty list, not unobservable, when an observable run read nothing', async () => {
    const observation = { observable: true as const, baseline: new Map() }
    expect(await finishReadObservation('/nowhere', observation)).toStrictEqual(
      [],
    )
  })

  it('names the page that was opened and not the one that was left alone', async () => {
    const root = await wikiFixture()
    const observation = await beginReadObservation(root)
    if (!observation.observable) return // relatime host: nothing to assert
    await readFile(join(root, 'topics', 'opened.md'), 'utf8')
    expect(await finishReadObservation(root, observation)).toStrictEqual([
      'topics/opened.md',
    ])
  })

  it('does not count a page the run created as a page it read', async () => {
    const root = await wikiFixture()
    const observation = await beginReadObservation(root)
    if (!observation.observable) return
    await writeFile(join(root, 'topics', 'written.md'), 'new\n')
    expect(await finishReadObservation(root, observation)).toStrictEqual([])
  })
})
