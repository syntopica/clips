import { chmodSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { makeSyntopicaConfigFixture } from './make-syntopica-config-fixture.ts'
import { temporaryDir } from './temporary-dir.ts'

export function makeDoctorFixture(): {
  parent: string
  data: string
  environ: NodeJS.ProcessEnv
} {
  const parent = temporaryDir('syntopica-doctor-')
  const data = makeSyntopicaConfigFixture(parent)
  for (const directory of [
    'brain/notes',
    'brain/captures',
    'brain/.ingest',
    'atrium',
    'conversations',
    '.config',
    'bin',
  ])
    mkdirSync(join(data, directory), { recursive: true })
  writeFileSync(join(data, 'brain/index.md'), '')
  for (const filename of [
    'newsletter-accepted.json',
    'newsletter-rejected.json',
    'newsletter-rejected-booking.json',
    'project-aliases.json',
  ])
    writeFileSync(join(data, '.config', filename), '[]')
  for (const command of ['git', 'uv', 'node', 'pnpm']) {
    const path = join(data, 'bin', command)
    writeFileSync(path, '#!/bin/sh\nexit 0\n')
    chmodSync(path, 0o755)
  }
  return { parent, data, environ: { PATH: join(data, 'bin') } }
}
