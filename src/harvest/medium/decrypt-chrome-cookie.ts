import { createDecipheriv } from 'node:crypto'

/** AES-128-CBC with an IV of 16 spaces, the scheme behind Chrome's `v10`
 * cookie prefix.
 * docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md:80-87.
 *
 * Verified 2026-07-29: current Chrome (v10.5 cookie encryption) prepends a
 * 32-byte host hash to the plaintext, so the decrypted block is
 * `<32-byte hash><value><PKCS#7 padding>`. Dropping those 32 bytes is the
 * whole trick - without it the UTF-8 decode produces mojibake and reads
 * exactly like a wrong key, which is the wrong thing to go debugging.
 *
 * Node's automatic padding is disabled and the padding stripped by hand: the
 * host-hash prefix means the final block cannot be trusted to unpad cleanly on
 * Node's terms, and a `final()` throw would again masquerade as a bad key. */
export const decryptChromeCookie = (encrypted: Buffer, key: Buffer): string => {
  if (encrypted.subarray(0, 3).toString('latin1') !== 'v10')
    throw new Error(
      'the cookie value is not v10-encrypted; Chrome changed its cookie encryption scheme',
    )
  const decipher = createDecipheriv('aes-128-cbc', key, Buffer.alloc(16, ' '))
  decipher.setAutoPadding(false)
  const padded = Buffer.concat([
    decipher.update(encrypted.subarray(3)),
    decipher.final(),
  ])
  const padding = padded.at(-1) ?? 0
  const plaintext =
    padding > 0 && padding <= 16
      ? padded.subarray(0, padded.length - padding)
      : padded
  return plaintext.subarray(32).toString('utf8')
}
