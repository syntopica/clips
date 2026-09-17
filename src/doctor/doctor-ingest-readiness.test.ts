import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import type { SyntopicaConfig } from '../config/syntopica-config.ts'
import { doctorIngestReadiness } from './doctor-ingest-readiness.ts'

const repository = (): string => {
  const path = mkdtempSync(join(tmpdir(), 'clips-ingest-'))
  execFileSync('git', ['init', '--quiet', '--initial-branch=main', path])
  return path
}

const configFor = (dataRoot: string, archive: string): SyntopicaConfig =>
  ({ dataRoot, archive }) as SyntopicaConfig

test('a fresh instance is reported, not failed', () => {
  const check = doctorIngestReadiness(configFor(repository(), repository()))
  expect(check.passed).toBe(true)
  expect(check.message).toContain('wiki has no commit')
  expect(check.message).toContain('archive has no origin/main')
})
