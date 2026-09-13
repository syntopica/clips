import { describe, expect, it } from 'vitest'
import { formatGradeReport } from './format-grade-report.ts'

const PAGE_PATH = 'topics/a.md'

describe('formatGradeReport', () => {
  it('prints a clean page with its evidence count', () => {
    expect(
      formatGradeReport([
        {
          page: PAGE_PATH,
          citedUrls: 2,
          evidenceClips: 2,
          result: {
            unsupported: [],
            uncheckable: [],
            misattributed: [],
            summary: 'Every claim traced.',
            verdict: 'clean',
          },
          failure: null,
          exempt: false,
        },
      ]),
    ).toBe(
      'topics/a.md: clean (2/2 cited sources on disk)\n  Every claim traced.\n',
    )
  })

  it('prints each unsupported claim under its page', () => {
    expect(
      formatGradeReport([
        {
          page: PAGE_PATH,
          citedUrls: 1,
          evidenceClips: 1,
          result: {
            unsupported: [{ claim: '40% faster', why: 'no figure in source' }],
            uncheckable: [],
            misattributed: [],
            summary: 'One inflated figure.',
            verdict: 'unsupported',
          },
          failure: null,
          exempt: false,
        },
      ]),
    ).toBe(
      'topics/a.md: 1 unsupported (1/1 cited sources on disk)\n  - "40% faster"\n    no figure in source\n',
    )
  })

  it('counts uncheckable claims beside the evidence, without listing them', () => {
    const report = formatGradeReport([
      {
        page: 'business/pyfirma.md',
        citedUrls: 1,
        evidenceClips: 1,
        result: {
          unsupported: [],
          uncheckable: [
            'the official Spanish e-signature application',
            'the invoice numbering restarts each calendar year',
          ],
          misattributed: [],
          summary: 'Two first-hand claims, nothing overstated.',
          verdict: 'clean',
        },
        failure: null,
        exempt: false,
      },
    ])

    // A page whose only findings are uncheckable is clean. The count says how
    // much of it nothing here can check; the claims themselves are not listed,
    // because they are all uncheckable for the same reason.
    expect(report).toBe(
      'business/pyfirma.md: clean (1/1 cited sources on disk, 2 uncheckable)\n  Two first-hand claims, nothing overstated.\n',
    )
    expect(report).not.toContain('e-signature application')
  })

  it('never calls an ungraded page clean', () => {
    const report = formatGradeReport([
      {
        page: PAGE_PATH,
        citedUrls: 0,
        evidenceClips: 0,
        result: null,
        failure: 'page cites no source urls',
        exempt: false,
      },
    ])

    expect(report).toBe('topics/a.md: not graded - page cites no source urls\n')
    expect(report).not.toContain('clean')
  })

  it('prints an exempt page as neither clean nor not graded', () => {
    const report = formatGradeReport([
      {
        page: 'business/access.md',
        citedUrls: 0,
        evidenceClips: 0,
        result: null,
        failure: null,
        exempt: true,
      },
    ])

    expect(report).toBe(
      'business/access.md: exempt - declares `verification: exempt`, nothing on disk to grade against\n',
    )
    expect(report).not.toContain('clean')
    expect(report).not.toContain('not graded')
  })

  it('prints a misattributed marker under `!`, with the entry that was meant', () => {
    expect(
      formatGradeReport([
        {
          page: PAGE_PATH,
          citedUrls: 30,
          evidenceClips: 30,
          result: {
            unsupported: [],
            uncheckable: [],
            misattributed: [
              {
                claim: 'Dash0 ships an MCP server [S25]',
                marker: 'S25',
                shouldBe: 'S27',
                why: 'S25 is the Kubernetes newsletter',
              },
              {
                claim: 'The loader runs at boot [S3]',
                marker: 'S3',
                shouldBe: null,
                why: 'no source says when it runs',
              },
            ],
            summary: 'Two markers name the wrong entry.',
            verdict: 'unsupported',
          },
          failure: null,
          exempt: false,
        },
      ]),
    ).toBe(
      'topics/a.md: 2 misattributed (30/30 cited sources on disk)\n' +
        '  ! S25 -> S27: "Dash0 ships an MCP server [S25]"\n' +
        '    S25 is the Kubernetes newsletter\n' +
        '  ! S3: "The loader runs at boot [S3]"\n' +
        '    no source says when it runs\n',
    )
  })

  it('counts both classes when a page has each', () => {
    expect(
      formatGradeReport([
        {
          page: PAGE_PATH,
          citedUrls: 4,
          evidenceClips: 4,
          result: {
            unsupported: [{ claim: '40% faster', why: 'no figure in source' }],
            uncheckable: [],
            misattributed: [
              {
                claim: 'It landed in March [S2]',
                marker: 'S2',
                shouldBe: 'S4',
                why: 'S2 predates the release',
              },
            ],
            summary: 'One of each.',
            verdict: 'unsupported',
          },
          failure: null,
          exempt: false,
        },
      ]),
    ).toContain('1 unsupported, 1 misattributed (4/4 cited sources on disk)')
  })
})
