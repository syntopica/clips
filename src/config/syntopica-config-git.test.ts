import {
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { makeSyntopicaConfigFixture } from '../testing/make-syntopica-config-fixture.ts'
import { loadSyntopicaConfig } from './load-syntopica-config.ts'
import { runSyntopicaGit } from './run-syntopica-git.ts'

describe('loadSyntopicaConfig', () => {
  const localName = 'syntopica.local.json'
  let root: string
  let data: string
  beforeEach(() => {
    root = realpathSync(mkdtempSync(join(tmpdir(), 'syntopica-config-')))
    data = makeSyntopicaConfigFixture(root)
  })
  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it('accepts a repository subdirectory selected as archive', () => {
    mkdirSync(join(data, 'subdir'))
    writeFileSync(join(data, localName), '{"clips":{"archive":"subdir"}}')
    expect(loadSyntopicaConfig(data, {}).archive).toBe(join(data, 'subdir'))
  })
  it.each(['url', 'pushurl'])(
    'rejects credential-bearing remote %s without exposing it',
    (kind) => {
      expect(
        runSyntopicaGit(join(data, 'clips'), [
          'config',
          `remote.origin.${kind}`,
          'https://user:placeholder@example.test/repo.git',
        ]).status,
      ).toBe(0)
      expect(() => loadSyntopicaConfig(data, {})).toThrow('credentials')
      expect(() => loadSyntopicaConfig(data, {})).not.toThrow(/placeholder/u)
    },
  )
  it.each(['insteadOf', 'pushInsteadOf'])(
    'checks effective Git remote rewrites through %s',
    (kind) => {
      const archive = join(data, 'clips')
      expect(
        runSyntopicaGit(archive, [
          'remote',
          'add',
          'origin',
          'https://safe.example/repo.git',
        ]).status,
      ).toBe(0)
      expect(
        runSyntopicaGit(archive, [
          'config',
          `url.https://user:placeholder@example.test/.${kind}`,
          'https://safe.example/',
        ]).status,
      ).toBe(0)
      expect(() => loadSyntopicaConfig(data, {})).toThrow('credentials')
    },
  )
  it('rejects separate worktrees sharing an engine Git common directory', () => {
    const brain = join(root, 'engine-brain')
    const worktree = join(root, 'engine-worktree')
    expect(
      runSyntopicaGit(brain, [
        '-c',
        'user.name=Fixture',
        '-c',
        'user.email=fixture@example.test',
        'commit',
        '--allow-empty',
        '-m',
        'Fixture',
      ]).status,
    ).toBe(0)
    expect(
      runSyntopicaGit(brain, ['worktree', 'add', '--detach', worktree]).status,
    ).toBe(0)
    writeFileSync(
      join(data, localName),
      JSON.stringify({ engines: { clips: { path: worktree } } }),
    )
    expect(() => loadSyntopicaConfig(data, {})).toThrow('distinct Git roots')
  })

  it('accepts anonymous HTTPS, standard Git SSH, and local file remotes', () => {
    const archive = join(data, 'clips')
    for (const url of [
      'https://example.test/archive.git',
      'ssh://git@example.test/archive.git',
      'git@example.test:archive.git',
      '../local-archive',
    ]) {
      expect(
        runSyntopicaGit(archive, ['config', 'remote.origin.url', url]).status,
      ).toBe(0)
      expect(loadSyntopicaConfig(data, {}).archive).toBe(archive)
    }
  })

  it.each([
    'https://@example.test/repo',
    'ssh://git:@example.test/repo',
    'ssh://git@user@example.test/repo',
    'user@example.test:repo',
    'https://example.test/repo?signature=placeholder',
  ])('rejects authentication material in remote syntax %s', (url) => {
    expect(
      runSyntopicaGit(join(data, 'clips'), ['config', 'remote.origin.url', url])
        .status,
    ).toBe(0)
    expect(() => loadSyntopicaConfig(data, {})).toThrow()
    expect(() => loadSyntopicaConfig(data, {})).not.toThrow(/placeholder/u)
  })
})
