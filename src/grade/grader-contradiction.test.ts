import { describe, expect, it } from 'vitest'
import { graderContradiction } from './grader-contradiction.ts'

describe('graderContradiction', () => {
  it('accepts a clean label with an empty list', () => {
    expect(
      graderContradiction({
        unsupported: [],
        uncheckable: [],
        misattributed: [],
        summary: 'Every claim traced.',
        verdict: 'clean',
      }),
    ).toBeNull()
  })

  it('accepts an unsupported label with claims listed', () => {
    expect(
      graderContradiction({
        unsupported: [{ claim: '40% faster', why: 'no figure in source' }],
        uncheckable: [],
        misattributed: [],
        summary: 'One inflated figure.',
        verdict: 'unsupported',
      }),
    ).toBeNull()
  })

  it('catches findings that live only in the summary', () => {
    expect(
      graderContradiction({
        unsupported: [],
        uncheckable: [],
        misattributed: [],
        summary: 'The page attributes a pattern the source does not contain.',
        verdict: 'unsupported',
      }),
    ).toBe(
      'grader labelled the page unsupported and listed no claim; its summary reads: The page attributes a pattern the source does not contain.',
    )
  })

  it('accepts a clean label over uncheckable claims alone', () => {
    // Uncheckable does not feed the verdict, by design: a page whose only
    // findings are the owner's own knowledge is clean. Reading it as a
    // contradiction would turn every honestly marked page into `not graded`.
    expect(
      graderContradiction({
        unsupported: [],
        uncheckable: ['the official Spanish e-signature application'],
        misattributed: [],
        summary: 'One first-hand claim, nothing overstated.',
        verdict: 'clean',
      }),
    ).toBeNull()
  })

  it('catches a clean label over a list of claims', () => {
    expect(
      graderContradiction({
        unsupported: [
          { claim: 'a', why: 'b' },
          { claim: 'c', why: 'd' },
        ],
        uncheckable: [],
        misattributed: [],
        summary: 'Nothing to report.',
        verdict: 'clean',
      }),
    ).toBe('grader labelled the page clean and listed 2 unsupported claims')
  })
})
