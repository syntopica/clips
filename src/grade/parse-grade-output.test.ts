import { describe, expect, it } from 'vitest'
import { parseGradeOutput } from './parse-grade-output.ts'

describe('parseGradeOutput', () => {
  it('reads a verdict with findings', () => {
    expect(
      parseGradeOutput(
        JSON.stringify({
          unsupported: [
            { claim: 'It ships 40% faster', why: 'no number given' },
          ],
          uncheckable: [],
          misattributed: [],
          summary: 'One inflated figure.',
          verdict: 'unsupported',
        }),
      ),
    ).toEqual({
      unsupported: [{ claim: 'It ships 40% faster', why: 'no number given' }],
      uncheckable: [],
      misattributed: [],
      summary: 'One inflated figure.',
      verdict: 'unsupported',
    })
  })

  it('reads a clean verdict', () => {
    expect(
      parseGradeOutput(
        JSON.stringify({
          unsupported: [],
          uncheckable: ['The invoice numbering restarts each calendar year'],
          summary: 'Clean.',
          verdict: 'clean',
        }),
      ),
    ).toEqual({
      unsupported: [],
      uncheckable: ['The invoice numbering restarts each calendar year'],
      misattributed: [],
      summary: 'Clean.',
      verdict: 'clean',
    })
  })

  it('rejects output with no verdict label', () => {
    expect(
      parseGradeOutput(
        JSON.stringify({ unsupported: [], uncheckable: [], summary: 'Clean.' }),
      ),
    ).toBeNull()
  })

  it('rejects a missing message', () => {
    expect(parseGradeOutput(null)).toBeNull()
  })

  it('rejects output that is not JSON', () => {
    expect(parseGradeOutput('I could not read the page.')).toBeNull()
  })

  it('rejects JSON of the wrong shape', () => {
    expect(parseGradeOutput(JSON.stringify({ unsupported: ['a'] }))).toBeNull()
  })

  it('rejects output with no uncheckable list', () => {
    // A grader that omits the field has not said it found none: both
    // transports impose the schema, so a missing list means the output was
    // not the grader's. Null reads as `not graded`, which is the honest
    // failure - silence is how an unverified page came to look clean.
    expect(
      parseGradeOutput(
        JSON.stringify({
          unsupported: [],
          summary: 'Clean.',
          verdict: 'clean',
        }),
      ),
    ).toBeNull()
  })

  it('reads a misattributed marker, target named or not', () => {
    expect(
      parseGradeOutput(
        JSON.stringify({
          unsupported: [],
          uncheckable: [],
          misattributed: [
            {
              claim: 'Dash0 ships an MCP server [S25]',
              marker: 'S25',
              shouldBe: 'S27',
              why: 'S25 is the Kubernetes newsletter; S27 is the Dash0 post',
            },
            {
              claim: 'The loader runs at boot [S3]',
              marker: 'S3',
              shouldBe: null,
              why: 'S3 says nothing about boot and no other source does either',
            },
          ],
          summary: 'Two markers name the wrong entry.',
          verdict: 'unsupported',
        }),
      )?.misattributed,
    ).toEqual([
      {
        claim: 'Dash0 ships an MCP server [S25]',
        marker: 'S25',
        shouldBe: 'S27',
        why: 'S25 is the Kubernetes newsletter; S27 is the Dash0 post',
      },
      {
        claim: 'The loader runs at boot [S3]',
        marker: 'S3',
        shouldBe: null,
        why: 'S3 says nothing about boot and no other source does either',
      },
    ])
  })

  it('defaults misattributed to empty, so a log written before the class parses', () => {
    expect(
      parseGradeOutput(
        JSON.stringify({
          unsupported: [],
          uncheckable: [],
          summary: 'Clean.',
          verdict: 'clean',
        }),
      )?.misattributed,
    ).toEqual([])
  })
})
