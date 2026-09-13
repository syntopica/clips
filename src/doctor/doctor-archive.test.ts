import { expect, it } from 'vitest'

import { runSyntopicaGit } from '../config/run-syntopica-git.ts'
import { makeDoctorFixture } from '../testing/make-doctor-fixture.ts'
import { doctorArchive } from './doctor-archive.ts'

it('accepts an archive without remotes or with private remotes', () => {
  const fixture = makeDoctorFixture()
  const archive = `${fixture.data}/clips`
  expect(doctorArchive(archive).passed).toBe(true)
  runSyntopicaGit(archive, [
    'config',
    'remote.origin.url',
    'https://example.test/private',
  ])
  expect(doctorArchive(archive).passed).toBe(true)
})

it('inspects all named remotes and keeps their values out of diagnostics', () => {
  const fixture = makeDoctorFixture()
  const archive = `${fixture.data}/clips`
  runSyntopicaGit(archive, [
    'config',
    'remote.backup.url',
    'https://example.test/private',
  ])
  runSyntopicaGit(archive, [
    'config',
    'remote.backup.pushurl',
    'git@github.com:syntopica/brain.git',
  ])
  expect(doctorArchive(archive)).toEqual({
    passed: false,
    message: 'archive: public engine remote refused',
  })
})

it('does not throw when an unrelated remote contains malformed percent escapes', () => {
  const fixture = makeDoctorFixture()
  const archive = `${fixture.data}/clips`
  runSyntopicaGit(archive, [
    'config',
    'remote.origin.url',
    'https://example.test/%malformed',
  ])
  expect(doctorArchive(archive).passed).toBe(true)
})
