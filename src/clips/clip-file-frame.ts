import { NUL_BYTE } from './nul-byte.ts'

/** The relative path, a NUL, the byte length, a NUL, the bytes, a NUL. The
 * length is what stops content moving between two files from producing the same
 * digest. */
export const clipFileFrame = (relativePath: string, bytes: Buffer): Buffer =>
  Buffer.concat([
    Buffer.from(relativePath, 'utf8'),
    NUL_BYTE,
    Buffer.from(String(bytes.byteLength), 'utf8'),
    NUL_BYTE,
    bytes,
    NUL_BYTE,
  ])
