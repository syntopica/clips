import { describe, expect, it } from 'vitest'
import { noClaimsVerdict } from './no-claims-verdict.ts'

describe('noClaimsVerdict', () => {
  it('catches the truncated-prompt summary measured on 2026-08-08', () => {
    expect(
      noClaimsVerdict({
        unsupported: [],
        uncheckable: [],
        misattributed: [],
        summary:
          'The prompt was truncated before any specific claims were provided.',
        verdict: 'clean',
      }),
    ).toBe(
      'grader reports it saw no claims and still labelled the page clean; its summary reads: The prompt was truncated before any specific claims were provided.',
    )
  })

  it('catches the no-task summary measured on 2026-08-08', () => {
    expect(
      noClaimsVerdict({
        unsupported: [],
        uncheckable: [],
        misattributed: [],
        summary: 'There was no task to complete.',
        verdict: 'clean',
      }),
    ).not.toBeNull()
  })

  it('accepts a real clean pass that phrases its verdict as an absence', () => {
    // "no unsupported claims" describes the findings, not the input. Matching
    // it is the always-fires failure this check exists to avoid.
    expect(
      noClaimsVerdict({
        unsupported: [],
        uncheckable: [],
        misattributed: [],
        summary: 'No unsupported claims; every figure traced to its source.',
        verdict: 'clean',
      }),
    ).toBeNull()
  })

  it('accepts a clean pass over uncheckable claims whatever the summary', () => {
    // A grader that listed anything did read the page.
    expect(
      noClaimsVerdict({
        unsupported: [],
        uncheckable: ['first-hand claim'],
        misattributed: [],
        summary: 'The evidence was incomplete for one first-hand claim.',
        verdict: 'clean',
      }),
    ).toBeNull()
  })

  it('leaves an unsupported verdict to graderContradiction', () => {
    expect(
      noClaimsVerdict({
        unsupported: [],
        uncheckable: [],
        misattributed: [],
        summary: 'The prompt was truncated.',
        verdict: 'unsupported',
      }),
    ).toBeNull()
  })

  it('accepts an ordinary clean summary', () => {
    expect(
      noClaimsVerdict({
        unsupported: [],
        uncheckable: [],
        misattributed: [],
        summary: 'Every claim traced.',
        verdict: 'clean',
      }),
    ).toBeNull()
  })
})
