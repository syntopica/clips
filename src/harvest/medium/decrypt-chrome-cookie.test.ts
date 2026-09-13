import { createCipheriv, randomBytes } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { decryptChromeCookie } from './decrypt-chrome-cookie.ts'

const key = randomBytes(16)

// The fixture is built the way Chrome builds it, so the test proves the
// 32-byte host-hash prefix is handled rather than trusting a captured blob.
const encryptLikeChrome = (value: string, prefixBytes: number): Buffer => {
  const cipher = createCipheriv('aes-128-cbc', key, Buffer.alloc(16, ' '))
  const plaintext = Buffer.concat([
    Buffer.alloc(prefixBytes, 0x2a),
    Buffer.from(value, 'utf8'),
  ])
  return Buffer.concat([
    Buffer.from('v10', 'latin1'),
    cipher.update(plaintext),
    cipher.final(),
  ])
}

describe('decryptChromeCookie', () => {
  it('recovers the value from behind the 32-byte host hash', () => {
    const value = 'sid-value-with-curly-quotes-and-accents-cafe'
    expect(decryptChromeCookie(encryptLikeChrome(value, 32), key)).toBe(value)
  })

  it('recovers a value long enough to span several AES blocks', () => {
    const value = 'a'.repeat(200)
    expect(decryptChromeCookie(encryptLikeChrome(value, 32), key)).toBe(value)
  })

  it('does not return the value when the host hash is absent', () => {
    const value = 'sid-value-without-the-host-hash-prefix'
    expect(decryptChromeCookie(encryptLikeChrome(value, 0), key)).not.toBe(
      value,
    )
  })

  it('rejects a buffer that does not start with v10', () => {
    const notV10 = Buffer.concat([
      Buffer.from('v11', 'latin1'),
      randomBytes(48),
    ])
    expect(() => decryptChromeCookie(notV10, key)).toThrow(/not v10-encrypted/)
  })
})
