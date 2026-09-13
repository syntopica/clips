import { expect, it } from 'vitest'

import { loadSyntopicaConfig } from '../config/load-syntopica-config.ts'
import { makeDoctorFixture } from '../testing/make-doctor-fixture.ts'
import { doctorExecutables } from './doctor-executables.ts'

it('checks enabled adapters once and leaves manual runners independent', () => {
  const fixture = makeDoctorFixture()
  const config = loadSyntopicaConfig(fixture.data, fixture.environ)
  expect(
    doctorExecutables(
      { ...config, runners: { synthesis: 'manual' } },
      fixture.environ,
    ).passed,
  ).toBe(true)
  expect(
    doctorExecutables(
      {
        ...config,
        runners: {
          grade: 'agy-fine',
          triage: 'agy-bulk',
          synthesis: 'cursor',
          triageRefiner: 'codex',
        },
        browser: config.index,
      },
      fixture.environ,
    ),
  ).toEqual({ passed: false, message: 'executables: 4 missing' })
})
