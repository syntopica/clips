import type { AuditFinding } from './audit-finding.ts'

/** One heading per check, and the object's key order is the report's section
 * order. Keeping it here rather than inside the formatter means adding a check
 * is one entry plus one finder, with nothing to reorder. */
export const AUDIT_CHECK_HEADINGS: Record<AuditFinding['check'], string> = {
  'source-drift': 'source drift - the clip changed after the page was written',
  'unresolved-citation':
    'unresolved citations - cited url with no clip on disk',
  'missing-ledger-page':
    'missing ledger pages - a published page that is no longer at that path',
  'stale-page': 'stale pages - untouched long enough to want a look',
  'stale-verification':
    'stale verifications - `last_verified:` older than the line it stands for',
  'unverifiable-page':
    'unverifiable pages - no evidence on disk and no declared exemption',
  'open-contradiction':
    'open contradictions - declared in frontmatter, unresolved',
  'inline-maths': 'inline maths - `$…$` with a LaTeX command, banned by SCHEMA',
  'unclosed-maths-block':
    'unclosed maths blocks - an odd number of `$$` delimiters',
  'unresolved-claim-ref':
    'unresolved claim refs - a marker naming a source the page does not have',
  'uncited-source':
    'uncited sources - listed in a marked page and cited by no claim',
  'unreadable-source':
    'unreadable sources - listed in a page and opened by no reader of the field',
  'ungrounded-quote':
    'ungrounded quotes - a marked quotation its own source does not contain',
  'undated-supersession':
    'undated supersessions - a `## Contested` entry that says when nothing',
}
