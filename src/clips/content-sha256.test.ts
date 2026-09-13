import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { contentSha256 } from './content-sha256.ts'

const roots: string[] = []

const clipWith = (files: Record<string, string>): string => {
  const root = mkdtempSync(join(tmpdir(), 'clip-hash-'))
  roots.push(root)
  for (const [name, body] of Object.entries(files))
    writeFileSync(join(root, name), body)
  return root
}

afterAll(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true })
})

const base = { 'metadata.json': '{"a":1}', 'index.md': '# title\n' }

describe('contentSha256', () => {
  it('is stable for the same bytes', async () => {
    expect(await contentSha256(clipWith(base))).toBe(
      await contentSha256(clipWith(base)),
    )
  })
  it('ignores state.json, which is mutable', async () => {
    const withState = { ...base, 'state.json': '{"status":"pending"}' }
    expect(await contentSha256(clipWith(withState))).toBe(
      await contentSha256(clipWith(base)),
    )
  })
  it('changes when one byte is appended', async () => {
    const appended = { ...base, 'index.md': '# title\n\n' }
    expect(await contentSha256(clipWith(appended))).not.toBe(
      await contentSha256(clipWith(base)),
    )
  })
  it('changes when source.html appears', async () => {
    const withHtml = { ...base, 'source.html': '<p>x</p>' }
    expect(await contentSha256(clipWith(withHtml))).not.toBe(
      await contentSha256(clipWith(base)),
    )
  })
  it('distinguishes content moved between the two files by fixed path names', async () => {
    const left = await contentSha256(
      clipWith({ 'metadata.json': 'ab', 'index.md': 'c' }),
    )
    const right = await contentSha256(
      clipWith({ 'metadata.json': 'a', 'index.md': 'bc' }),
    )
    expect(left).not.toBe(right)
  })
})

describe('contentSha256 - length framing and missing files', () => {
  it('requires the length field to distinguish content that forges frame boundaries', async () => {
    // Content collision: without length both concatenate to identical bytes.
    const clipA = await contentSha256(
      clipWith({ 'metadata.json': 'X', 'index.md': '\0index.md\0Y' }),
    )
    const clipB = await contentSha256(
      clipWith({ 'metadata.json': 'X\0index.md\0', 'index.md': 'Y' }),
    )
    expect(clipA).not.toBe(clipB)
  })
  it('refuses a clip with no metadata.json', async () => {
    await expect(
      contentSha256(clipWith({ 'index.md': '# t\n' })),
    ).rejects.toThrow(/metadata\.json/)
  })
  it('refuses a clip with no index.md', async () => {
    await expect(
      contentSha256(clipWith({ 'metadata.json': '{"a":1}' })),
    ).rejects.toThrow(/index\.md/)
  })
})
