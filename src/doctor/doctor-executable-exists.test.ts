import { chmodSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { expect, it } from 'vitest'

import { temporaryDir } from '../testing/temporary-dir.ts'
import { doctorExecutableExists } from './doctor-executable-exists.ts'

it('uses the supplied PATH and requires an executable file', () => {
  const root = temporaryDir('doctor-command-')
  const command = join(root, 'example')
  writeFileSync(command, '#!/bin/sh\nexit 0\n', { mode: 0o644 })
  expect(doctorExecutableExists('example', { PATH: root })).toBe(false)
  chmodSync(command, 0o755)
  expect(doctorExecutableExists('example', { PATH: root })).toBe(true)
  expect(doctorExecutableExists(command, { PATH: '' })).toBe(true)
  mkdirSync(join(root, 'directory'))
  expect(doctorExecutableExists('directory', { PATH: root })).toBe(false)
  expect(doctorExecutableExists('absent', { PATH: root })).toBe(false)
})
