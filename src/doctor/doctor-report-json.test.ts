import { rmSync, writeFileSync } from 'node:fs'

import { afterEach, expect, it, vi } from 'vitest'

import { runSyntopicaGit } from '../config/run-syntopica-git.ts'
import { makeDoctorFixture } from '../testing/make-doctor-fixture.ts'
import { doctorReport } from './doctor-report.ts'

type Document = {
  schemaVersion: number
  ok: boolean
  checks: { name: string; ok: boolean; code: string }[]
}

const fixtures: string[] = []
afterEach(() => {
  vi.restoreAllMocks()
  for (const fixture of fixtures.splice(0))
    rmSync(fixture, { recursive: true, force: true })
})

it('prints a codes-only JSON document for a healthy instance', () => {
  const fixture = makeDoctorFixture()
  fixtures.push(fixture.parent)
  const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true)
  expect(doctorReport(fixture.data, fixture.environ, true)).toBe(0)
  expect(stdout).toHaveBeenCalledTimes(1)
  const document = JSON.parse(String(stdout.mock.calls[0]?.[0])) as Document
  expect(document.schemaVersion).toBe(1)
  expect(document.ok).toBe(true)
  expect(document.checks.map((check) => check.name)).toEqual([
    'configuration',
    'paths',
    'repositories',
    'archive',
    'ingest',
    'api',
    'executables',
    'credentials',
  ])
  expect(document.checks.every((check) => check.ok)).toBe(true)
  expect(document.checks).toContainEqual({
    name: 'credentials',
    ok: true,
    code: 'credentials_not_required',
  })
})

it('reports failing checks in JSON by code, never by URL or command name', () => {
  const fixture = makeDoctorFixture()
  fixtures.push(fixture.parent)
  const url = 'https://github.com/syntopica/clips.git'
  runSyntopicaGit(fixture.data, [
    '-C',
    'clips',
    'config',
    'remote.origin.url',
    url,
  ])
  const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true)
  expect(
    doctorReport(
      fixture.data,
      {
        ...fixture.environ,
        CLIPS_GRADE_RUNNER: 'cursor',
        CAPTURE_MIRROR: 'on',
      },
      true,
    ),
  ).toBe(1)
  const written = stdout.mock.calls.flat().join('\n')
  const document = JSON.parse(written) as Document
  expect(document.ok).toBe(false)
  expect(document.checks).toContainEqual({
    name: 'archive',
    ok: false,
    code: 'archive_public_remote',
  })
  expect(document.checks).toContainEqual({
    name: 'executables',
    ok: false,
    code: 'executables_missing',
  })
  expect(document.checks).toContainEqual({
    name: 'credentials',
    ok: false,
    code: 'credentials_absent',
  })
  expect(written).not.toContain(url)
  expect(written).not.toContain('cursor-agent')
})

it('reports an invalid configuration in JSON as one config_invalid check', () => {
  const fixture = makeDoctorFixture()
  fixtures.push(fixture.parent)
  const token = 'distinctive-doctor-token-never-print-82713'
  writeFileSync(
    `${fixture.data}/syntopica.local.json`,
    JSON.stringify({ unexpected: token }),
  )
  const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true)
  expect(doctorReport(fixture.data, fixture.environ, true)).toBe(1)
  const written = stdout.mock.calls.flat().join('\n')
  expect(JSON.parse(written)).toEqual({
    schemaVersion: 1,
    ok: false,
    checks: [{ name: 'configuration', ok: false, code: 'config_invalid' }],
  })
  expect(written).not.toContain(token)
})
