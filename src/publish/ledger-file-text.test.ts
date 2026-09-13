import { describe, expect, it } from 'vitest'
import type { Ledger } from '../ledger/ledger.ts'
import { checkoutRoot } from '../testing/checkout-root.ts'
import { ledgerFileText } from './ledger-file-text.ts'

/** The checkout that runs these tests. */
const BRAIN = checkoutRoot()

const LEDGER: Ledger = {
  schemaVersion: 1,
  clipId: '01KYN2AE32ZMGENZQMZ3SXN90C',
  clipFormatVersion: 1,
  contentSha256: 'a'.repeat(64),
  clipRepoCommit: 'b'.repeat(40),
  clipSourcePath: 'clips/pending/2026/07/example',
  brainBaseCommit: 'c'.repeat(40),
  processedAt: '2026-08-02T10:00:00.000Z',
  reviewedAt: '2026-08-02T10:00:00.000Z',
  pagesTouched: ['topics/pyfirma.md'],
  synthesizer: {
    model: 'claude-in-the-loop',
    promptSha256: 'd'.repeat(64),
    toolVersion: '0.1.0',
    boundary: 'human-review',
  },
}

describe('ledgerFileText', () => {
  it('collapses pagesTouched, which is what JSON.stringify got wrong', async () => {
    const text = await ledgerFileText(BRAIN, LEDGER)
    expect(text).toContain('"pagesTouched": ["topics/pyfirma.md"]')
    expect(text).not.toBe(`${JSON.stringify(LEDGER, null, 2)}\n`)
  })

  it('round-trips to the same ledger', async () => {
    expect(JSON.parse(await ledgerFileText(BRAIN, LEDGER))).toEqual(LEDGER)
  })
})
