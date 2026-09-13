import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { runSyntopicaGit } from '../config/run-syntopica-git.ts'
import { syntopicaSchemaPath } from './syntopica-schema-path.ts'

export function makeSyntopicaConfigFixture(root: string): string {
  const data = join(root, 'data')
  for (const repository of [
    data,
    join(root, 'engine-brain'),
    join(root, 'engine-clips'),
  ]) {
    mkdirSync(repository, { recursive: true })
    const result = runSyntopicaGit(repository, [
      'init',
      '--quiet',
      '--template=',
      '--initial-branch=main',
    ])
    if (result.status !== 0)
      throw new Error('Cannot initialize fixture repository')
  }
  mkdirSync(join(data, 'clips'))
  mkdirSync(join(root, 'engine-brain', 'schema'))
  copyFileSync(
    syntopicaSchemaPath(),
    join(root, 'engine-brain', 'schema', 'syntopica-config.schema.json'),
  )
  writeFileSync(
    join(data, 'syntopica.config.json'),
    JSON.stringify({
      schemaVersion: 1,
      instanceId: 'fixture',
      brain: {
        pages: ['brain/notes'],
        sources: 'brain/captures',
        index: 'brain/index.md',
        ledger: 'brain/.ingest',
      },
      engines: {
        brain: { path: '../engine-brain', apiVersion: 1 },
        clips: { path: '../engine-clips', apiVersion: 1 },
      },
    }),
  )
  return data
}
