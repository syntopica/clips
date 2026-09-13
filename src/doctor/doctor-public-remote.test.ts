import { expect, it } from 'vitest'

import { doctorPublicRemote } from './doctor-public-remote.ts'

it.each([
  'https://github.com/Syntopica/Clips.GIT/',
  'git@github.com:syntopica/brain.git',
  'ssh://git@github.com:22/syntopica/clips',
  'git://github.com/syntopica/brain',
  'https://github.com/%73yntopica/clips',
])('recognizes the public repository identity in %s', (url) => {
  expect(doctorPublicRemote(url)).toBe(true)
})

it.each([
  'https://example.test/syntopica/clips',
  'https://github.com/example/private',
  '../private-archive',
  'https://github.com/%not-encoded/clips',
])('does not throw for nonmatching or malformed remote %s', (url) => {
  expect(doctorPublicRemote(url)).toBe(false)
})
