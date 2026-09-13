import { describe, expect, it } from 'vitest'
import { formatAuditReport } from './format-audit-report.ts'

describe('formatAuditReport', () => {
  it('prints every check even when it found nothing', () => {
    const report = formatAuditReport([])

    // A silent check and a check that never ran read identically otherwise,
    // which is the failure the grade report was already shaped to avoid.
    expect(report).toContain('source drift')
    expect(report).toContain('unresolved citations')
    expect(report).toContain('missing ledger pages')
    expect(report).toContain('stale pages')
    expect(report).toContain('stale verifications')
    expect(report).toContain('unverifiable pages')
    expect(report).toContain('open contradictions')
    expect(report).toContain('inline maths')
    expect(report).toContain('unclosed maths blocks')
    expect(report).toContain('unresolved claim refs')
    expect(report).toContain('uncited sources')
    expect(report).toContain('unreadable sources')
    expect(report).toContain('ungrounded quotes')
    expect(report).toContain('undated supersessions')
    expect(report.match(/ {2}none/gu)).toHaveLength(14)
  })

  it('groups findings under their own check', () => {
    const report = formatAuditReport([
      {
        check: 'unresolved-citation',
        subject: 'topics/a.md',
        detail: '1 of 2',
      },
      { check: 'source-drift', subject: '01ABC', detail: 'changed' },
      {
        check: 'missing-ledger-page',
        subject: '01DEF',
        detail: 'gone',
      },
      { check: 'stale-page', subject: 'topics/b.md', detail: '90 days ago' },
      {
        check: 'stale-verification',
        subject: 'topics/g.md',
        detail: '120 days ago',
      },
      {
        check: 'unverifiable-page',
        subject: 'business/f.md',
        detail: 'no evidence, no exemption',
      },
      {
        check: 'open-contradiction',
        subject: 'business/c.md',
        detail: 'two figures',
      },
      {
        check: 'inline-maths',
        subject: 'topics/d.md',
        detail: 'line 3: $n \\times k$',
      },
      {
        check: 'unclosed-maths-block',
        subject: 'topics/e.md',
        detail: '1 `$$` delimiter',
      },
      {
        check: 'unresolved-claim-ref',
        subject: 'topics/h.md',
        detail: 'S3 names no entry in a 1-source list',
      },
      {
        check: 'uncited-source',
        subject: 'topics/i.md',
        detail: 'S2 listed in sources and cited by no claim',
      },
      {
        check: 'unreadable-source',
        subject: 'topics/l.md',
        detail: 'sources/vault/a listed in sources and opened by no reader',
      },
      {
        check: 'ungrounded-quote',
        subject: 'topics/j.md',
        detail:
          '[S1] is quoted "a b c d e f" and the source does not contain it',
      },
      {
        check: 'undated-supersession',
        subject: 'topics/k.md',
        detail: 'contested entry with no date: held A; now B',
      },
    ])

    expect(report.indexOf('01ABC')).toBeLessThan(report.indexOf('topics/a.md'))
    expect(report.indexOf('topics/a.md')).toBeLessThan(report.indexOf('01DEF'))
    expect(report).toContain('  01ABC: changed')
    expect(report).toContain('  topics/a.md: 1 of 2')
    expect(report).not.toContain('none')
  })
})
