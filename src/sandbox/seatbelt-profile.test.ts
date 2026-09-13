import { describe, expect, it } from 'vitest'
import { seatbeltProfile } from './seatbelt-profile.ts'

const ROOTS = {
  readable: ['/usr', '/bin'],
  writable: ['/tmp/wt'],
  executable: ['/bin', '/usr/bin'],
  allowNetwork: false,
}

describe('seatbeltProfile', () => {
  it('denies everything by default', () => {
    expect(seatbeltProfile(ROOTS)).toContain('(deny default)')
  })

  it('grants read on the readable roots', () => {
    expect(seatbeltProfile(ROOTS)).toContain(
      '(allow file-read* (subpath "/usr")',
    )
  })

  it('grants write only on the writable roots', () => {
    const profile = seatbeltProfile(ROOTS)
    expect(profile).toContain('(allow file-write* (subpath "/tmp/wt"))')
    expect(profile).not.toContain('(allow file-write* (subpath "/usr"))')
  })

  it('denies the network unless asked', () => {
    expect(seatbeltProfile(ROOTS)).toContain('(deny network*)')
    expect(seatbeltProfile({ ...ROOTS, allowNetwork: true })).toContain(
      '(allow network*)',
    )
  })

  it('grants the root directory entry as a literal, never as a subpath', () => {
    const profile = seatbeltProfile(ROOTS)
    expect(profile).toContain('(allow file-read* (literal "/"))')
    expect(profile).not.toContain('(subpath "/")')
  })

  it('rejects a root containing a quote, which would break out of the profile', () => {
    expect(() => seatbeltProfile({ ...ROOTS, readable: ['/tmp/a"b'] })).toThrow(
      /quote/i,
    )
  })

  it('rejects a relative root', () => {
    expect(() =>
      seatbeltProfile({ ...ROOTS, readable: ['relative/path'] }),
    ).toThrow(/absolute/i)
  })
})
