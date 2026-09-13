import { mkdirSync, symlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { syntopicaConfigTestState } from '../testing/syntopica-config-test-state.ts'
import { runSyntopicaGit } from './run-syntopica-git.ts'
import { validateSyntopicaGitRoots } from './validate-syntopica-git-roots.ts'

const brainDirectory = 'engine-brain'

describe('archive containment', () => {
  it.each(['clips', '.'])('accepts archive at %s', (archive) => {
    const { root, data } = syntopicaConfigTestState()
    expect(() => {
      validateSyntopicaGitRoots([
        data,
        join(data, archive),
        join(root, brainDirectory),
        join(root, 'engine-clips'),
      ])
    }).not.toThrow()
  })

  it.each(['missing', 'file', 'outside', 'symlink'])(
    'rejects %s archive',
    (location) => {
      const { root, data } = syntopicaConfigTestState()
      const outside = join(root, 'data-other')
      mkdirSync(outside)
      writeFileSync(join(data, 'file'), 'fixture')
      symlinkSync(outside, join(data, 'symlink'), 'dir')
      expect(() => {
        validateSyntopicaGitRoots([
          data,
          location === 'outside' ? outside : join(data, location),
          join(root, brainDirectory),
          join(root, 'engine-clips'),
        ])
      }).toThrow('Archive')
    },
  )
})

describe('validateSyntopicaGitRoots engine separation', () => {
  it('rejects both engines sharing the data repository', () => {
    const { data } = syntopicaConfigTestState()
    expect(() => {
      validateSyntopicaGitRoots([data, join(data, 'clips'), data, data])
    }).toThrow('distinct Git roots')
  })

  it.each([
    ['brain', '.'],
    ['clips', '.'],
    ['brain', 'clips'],
    ['clips', 'clips'],
  ])('rejects %s engine sharing data at %s', (engine, location) => {
    const { root, data } = syntopicaConfigTestState()
    expect(() => {
      validateSyntopicaGitRoots([
        data,
        join(data, 'clips'),
        engine === 'brain' ? join(data, location) : join(root, brainDirectory),
        engine === 'clips' ? join(data, location) : join(root, 'engine-clips'),
      ])
    }).toThrow()
  })

  it('rejects engines sharing a root', () => {
    const { root, data } = syntopicaConfigTestState()
    const brain = join(root, brainDirectory)
    expect(() => {
      validateSyntopicaGitRoots([data, join(data, 'clips'), brain, brain])
    }).toThrow('distinct Git roots')
  })

  it.each(['data', brainDirectory])(
    'rejects an engine sharing the Git common directory of %s',
    (owner) => {
      const { root, data } = syntopicaConfigTestState()
      const repository = join(root, owner)
      const worktree = join(root, 'engine-worktree')
      expect(
        runSyntopicaGit(repository, [
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
        runSyntopicaGit(repository, ['worktree', 'add', '--detach', worktree])
          .status,
      ).toBe(0)
      expect(() => {
        validateSyntopicaGitRoots([
          data,
          join(data, 'clips'),
          join(root, brainDirectory),
          worktree,
        ])
      }).toThrow('distinct Git roots')
    },
  )
})
