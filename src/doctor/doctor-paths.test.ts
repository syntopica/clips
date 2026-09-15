import { existsSync, rmSync, writeFileSync } from 'node:fs'

import { expect, it } from 'vitest'

import { loadSyntopicaConfig } from '../config/load-syntopica-config.ts'
import { makeDoctorFixture } from '../testing/make-doctor-fixture.ts'
import { doctorPaths } from './doctor-paths.ts'

it('includes optional defaults and project roots in filesystem checks', () => {
  const fixture = makeDoctorFixture()
  const config = loadSyntopicaConfig(fixture.data, fixture.environ)
  expect(doctorPaths(config).passed).toBe(true)
  rmSync(config.newsletterRejectedBookingSenders)
  writeFileSync(
    `${fixture.data}/syntopica.local.json`,
    JSON.stringify({ projects: { roots: [`${fixture.parent}/absent`] } }),
  )
  const check = doctorPaths(loadSyntopicaConfig(fixture.data, fixture.environ))
  expect(check.passed).toBe(false)
  expect(check.message).toContain('paths: 2 missing (')
  expect(check.message).toContain('newsletter-rejected-booking.json')
  expect(check.message).toContain('absent')
})

it.each(['atrium', 'state/agent-memory'])(
  'names absent state without failing or creating it: %s',
  (memoryPath) => {
    const fixture = makeDoctorFixture()
    rmSync(`${fixture.data}/atrium`, { recursive: true })
    writeFileSync(
      `${fixture.data}/syntopica.local.json`,
      JSON.stringify({ atrium: { path: memoryPath } }),
    )
    const config = loadSyntopicaConfig(fixture.data, fixture.environ)
    expect(doctorPaths(config)).toEqual({
      passed: true,
      message: `paths: required paths present; state not created yet (${memoryPath})`,
    })
    expect(existsSync(config.atriumPath)).toBe(false)
  },
)

it.each([false, true])(
  'still fails for missing content with absent state %s',
  (missingState) => {
    const fixture = makeDoctorFixture()
    writeFileSync(
      `${fixture.data}/syntopica.local.json`,
      JSON.stringify({ brain: { pages: ['brain/absent'] } }),
    )
    if (missingState) rmSync(`${fixture.data}/atrium`, { recursive: true })
    const config = loadSyntopicaConfig(fixture.data, fixture.environ)
    expect(doctorPaths(config)).toEqual({
      passed: false,
      message:
        'paths: 1 missing (brain/absent)' +
        (missingState ? '; state not created yet (atrium)' : ''),
    })
  },
)

it('does not exempt content sharing a location with state', () => {
  const fixture = makeDoctorFixture()
  writeFileSync(
    `${fixture.data}/syntopica.local.json`,
    JSON.stringify({
      brain: { pages: ['shared'] },
      atrium: { path: 'shared' },
    }),
  )
  const config = loadSyntopicaConfig(fixture.data, fixture.environ)
  expect(doctorPaths(config)).toEqual({
    passed: false,
    message: 'paths: 1 missing (shared); state not created yet (shared)',
  })
})

it('checks configured legacy archives and desktop roots as content', () => {
  const fixture = makeDoctorFixture()
  writeFileSync(
    `${fixture.data}/syntopica.local.json`,
    JSON.stringify({
      clips: { legacyArchive: 'old-clips' },
      sessions: { desktopRoots: ['desktop'] },
    }),
  )
  const config = loadSyntopicaConfig(fixture.data, fixture.environ)
  expect(doctorPaths(config)).toEqual({
    passed: false,
    message: 'paths: 2 missing (old-clips, desktop)',
  })
})
