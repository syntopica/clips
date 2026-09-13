import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { evidenceBytes } from './evidence-bytes.ts'

let root = ''

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'clips-evidence-'))
  writeFileSync(join(root, 'a'), 'x'.repeat(100))
  writeFileSync(join(root, 'b'), 'y'.repeat(23))
})

afterAll(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('evidenceBytes', () => {
  it('sums the sizes it was given', async () => {
    expect(await evidenceBytes([join(root, 'a'), join(root, 'b')])).toBe(123)
  })

  it('counts a missing path as nothing rather than failing the run', async () => {
    // The on-disk count already reports the shortfall; a budget check must not
    // become the thing that loses a page.
    expect(await evidenceBytes([join(root, 'a'), join(root, 'gone')])).toBe(100)
  })

  it('is zero for no evidence', async () => {
    expect(await evidenceBytes([])).toBe(0)
  })
})
