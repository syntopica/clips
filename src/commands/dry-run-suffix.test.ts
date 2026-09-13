import { describe, expect, it } from 'vitest'
import { dryRunSuffix } from './dry-run-suffix.ts'

const verdict = (bucket: string) => ({ bucket, run: '2026-07-30/run.jsonl' })

describe('dryRunSuffix', () => {
  it('says nothing for a clip that is not pending', () => {
    expect(dryRunSuffix('reconciled', null, 'synthesis-candidate')).toBe('')
  })

  it('reports the route when nothing demoted the capture', () => {
    expect(dryRunSuffix('pending', null, 'synthesis-candidate')).toBe(
      ' -> would route synthesis-candidate',
    )
  })

  it('reports a skip when the latest verdict demoted the capture', () => {
    expect(
      dryRunSuffix('pending', verdict('rejected'), 'synthesis-candidate'),
    ).toBe(' -> would skip (latest verdict rejected, 2026-07-30/run.jsonl)')
  })
})
