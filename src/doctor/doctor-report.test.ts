import { copyFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { runSyntopicaGit } from '../config/run-syntopica-git.ts'
import { makeDoctorFixture } from '../testing/make-doctor-fixture.ts'
import { doctorReport } from './doctor-report.ts'

const fixtures: string[] = []
const remoteUrlKey = 'remote.origin.url'
const archiveFailure = 'FAIL archive'
afterEach(() => {
  vi.restoreAllMocks()
  for (const fixture of fixtures.splice(0))
    rmSync(fixture, { recursive: true, force: true })
})

describe('doctorReport', () => {
  it.each([
    'https://github.com/syntopica/clips.git',
    'git@github.com:syntopica/brain.git',
  ])('refuses public archive %s without printing its URL', (url) => {
    const fixture = makeDoctorFixture()
    fixtures.push(fixture.parent)
    runSyntopicaGit(fixture.data, ['-C', 'clips', 'config', remoteUrlKey, url])
    const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true)
    const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true)
    expect(doctorReport(fixture.data, fixture.environ)).toBe(1)
    expect(stdout.mock.calls.flat().join('\n')).toContain(archiveFailure)
    expect(
      [...stdout.mock.calls, ...stderr.mock.calls].flat().join('\n'),
    ).not.toContain(url)
  })

  it('reports credential presence without writing its value to either stream', () => {
    const fixture = makeDoctorFixture()
    fixtures.push(fixture.parent)
    const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true)
    const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true)
    const token = 'distinctive-doctor-token-never-print-82713'
    expect(
      doctorReport(fixture.data, {
        ...fixture.environ,
        CAPTURE_SERVICE_ORIGIN: 'https://capture.example.test',
        CAPTURE_TOKEN: token,
      }),
    ).toBe(0)
    expect(stdout.mock.calls.flat().join('\n')).toContain(
      'CAPTURE_TOKEN present',
    )
    expect(
      [...stdout.mock.calls, ...stderr.mock.calls].flat().join('\n'),
    ).not.toContain(token)
  })
})

it('reports all eight checks for a healthy instance', () => {
  const fixture = makeDoctorFixture()
  fixtures.push(fixture.parent)
  const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true)
  expect(doctorReport(fixture.data, fixture.environ)).toBe(0)
  expect(stdout).toHaveBeenCalledTimes(8)
})

it('requires a token only when capture is enabled', () => {
  const fixture = makeDoctorFixture()
  fixtures.push(fixture.parent)
  const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true)
  expect(
    doctorReport(fixture.data, { ...fixture.environ, CAPTURE_MIRROR: 'on' }),
  ).toBe(1)
  expect(stdout.mock.calls.flat().join('\n')).toContain(
    'FAIL credentials: CAPTURE_TOKEN absent',
  )
})

it('rejects a rewritten public push remote', () => {
  const fixture = makeDoctorFixture()
  fixtures.push(fixture.parent)
  runSyntopicaGit(fixture.data, [
    '-C',
    'clips',
    'config',
    remoteUrlKey,
    'https://example.test/private',
  ])
  runSyntopicaGit(fixture.data, [
    '-C',
    'clips',
    'config',
    'url.https://github.com/syntopica/clips.git.pushInsteadOf',
    'https://example.test/private',
  ])
  const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true)
  expect(doctorReport(fixture.data, fixture.environ)).toBe(1)
  expect(stdout.mock.calls.flat().join('\n')).toContain(archiveFailure)
})

it('rejects missing optional paths and unsupported engine versions together', () => {
  const fixture = makeDoctorFixture()
  fixtures.push(fixture.parent)
  rmSync(`${fixture.data}/.config/project-aliases.json`)
  writeFileSync(
    `${fixture.data}/syntopica.local.json`,
    JSON.stringify({ engines: { brain: { apiVersion: 2 } } }),
  )
  const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true)
  expect(doctorReport(fixture.data, fixture.environ)).toBe(1)
  expect(stdout.mock.calls.flat().join('\n')).toContain('FAIL paths')
  expect(stdout.mock.calls.flat().join('\n')).toContain('FAIL api')
})

it('rejects missing enabled runners and nonexecutable browsers', () => {
  const fixture = makeDoctorFixture()
  fixtures.push(fixture.parent)
  const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true)
  expect(
    doctorReport(fixture.data, {
      ...fixture.environ,
      CLIPS_GRADE_RUNNER: 'cursor',
      CLIPS_HEADLESS_BROWSER: './brain/index.md',
    }),
  ).toBe(1)
  expect(stdout.mock.calls.flat().join('\n')).toContain(
    'FAIL executables: 2 missing',
  )
})

it('reports invalid configuration without echoing supplied values', () => {
  const fixture = makeDoctorFixture()
  fixtures.push(fixture.parent)
  const token = 'distinctive-doctor-token-never-print-82713'
  writeFileSync(
    `${fixture.data}/syntopica.local.json`,
    JSON.stringify({ unexpected: token }),
  )
  const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true)
  const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true)
  expect(doctorReport(fixture.data, fixture.environ)).toBe(1)
  expect(stdout.mock.calls.flat().join('\n')).toContain('FAIL configuration')
  expect(
    [...stdout.mock.calls, ...stderr.mock.calls].flat().join('\n'),
  ).not.toContain(token)
})

it('explains invalid shared Git roots', () => {
  const fixture = makeDoctorFixture()
  fixtures.push(fixture.parent)
  mkdirSync(`${fixture.data}/schema`)
  copyFileSync(
    `${fixture.parent}/engine-brain/schema/syntopica-config.schema.json`,
    `${fixture.data}/schema/syntopica-config.schema.json`,
  )
  writeFileSync(
    `${fixture.data}/syntopica.local.json`,
    JSON.stringify({ engines: { brain: { path: '.' } } }),
  )
  const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true)
  expect(doctorReport(fixture.data, fixture.environ)).toBe(1)
  expect(stdout.mock.calls.flat().join('\n')).toContain('distinct Git roots')
})

it('rejects a public secondary push URL even when fetch is private', () => {
  const fixture = makeDoctorFixture()
  fixtures.push(fixture.parent)
  runSyntopicaGit(fixture.data, [
    '-C',
    'clips',
    'config',
    remoteUrlKey,
    'https://example.test/private',
  ])
  runSyntopicaGit(fixture.data, [
    '-C',
    'clips',
    'config',
    'remote.origin.pushurl',
    'git@github.com:syntopica/brain.git',
  ])
  const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true)
  expect(doctorReport(fixture.data, fixture.environ)).toBe(1)
  expect(stdout.mock.calls.flat().join('\n')).toContain(archiveFailure)
})

it('rejects a raw public URL even when Git rewrites it to a private host', () => {
  const fixture = makeDoctorFixture()
  fixtures.push(fixture.parent)
  runSyntopicaGit(fixture.data, [
    '-C',
    'clips',
    'config',
    remoteUrlKey,
    'https://github.com/syntopica/clips.git',
  ])
  runSyntopicaGit(fixture.data, [
    '-C',
    'clips',
    'config',
    'url.https://example.test/private.insteadOf',
    'https://github.com/syntopica/clips.git',
  ])
  const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true)
  expect(doctorReport(fixture.data, fixture.environ)).toBe(1)
  expect(stdout.mock.calls.flat().join('\n')).toContain(archiveFailure)
})
