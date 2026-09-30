import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { temporaryDir } from '../testing/temporary-dir.ts'
import { workerEndpoint } from './worker-endpoint.ts'
import { workerModel } from './worker-model.ts'

const instance = (config: unknown, credential: string | null): string => {
  const root = temporaryDir('clips-worker-instance-')
  mkdirSync(join(root, 'worker', 'state', 'tokens'), { recursive: true })
  writeFileSync(join(root, 'worker', 'config.json'), JSON.stringify(config))
  if (credential !== null)
    writeFileSync(
      join(root, 'worker', 'state', 'tokens', 'clips.token'),
      credential,
    )
  return root
}

describe('worker resolution from the instance', () => {
  it('needs no variables when the instance runs the worker', () => {
    const root = instance(
      { listen: '127.0.0.1:9000', models: { 'model-a': {} } },
      'tok\n',
    )
    expect(workerEndpoint({}, () => root)).toEqual({
      url: 'http://127.0.0.1:9000',
      token: 'tok',
    })
    expect(workerModel({}, () => root)).toBe('model-a')
  })

  it('lets the variables override the instance', () => {
    const root = instance({ models: { a: {}, b: {} } }, null)
    const tokenFile = join(root, 'other.token')
    writeFileSync(tokenFile, 'other')
    expect(
      workerEndpoint(
        {
          CLIPS_WORKER_URL: 'http://host:1/',
          CLIPS_WORKER_TOKEN_FILE: tokenFile,
        },
        () => root,
      ),
    ).toEqual({ url: 'http://host:1', token: 'other' })
    expect(workerModel({ CLIPS_WORKER_MODEL: 'b' }, () => root)).toBe('b')
  })

  it('takes the worker default address when listen is absent', () => {
    const root = instance({ models: {} }, 'tok')
    expect(workerEndpoint({}, () => root).url).toBe('http://127.0.0.1:8765')
  })

  it('stops with the fix when the token was never issued', () => {
    const root = instance({ models: {} }, null)
    expect(() => workerEndpoint({}, () => root)).toThrow(
      /worker token add --kind producer --name clips/,
    )
  })

  it('refuses to guess between several pinned models', () => {
    const root = instance({ models: { a: {}, b: {} } }, 'tok')
    expect(() => workerModel({}, () => root)).toThrow(/CLIPS_WORKER_MODEL/)
  })
})
