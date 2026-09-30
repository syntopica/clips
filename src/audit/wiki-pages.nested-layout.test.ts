import { describe, expect, it } from 'vitest'
import { withSyntopicaConfig } from '../config/with-syntopica-config.ts'
import { resolveLocalSource } from '../grade/resolve-local-source.ts'
import { nestedWikiConfig } from '../testing/nested-wiki-config.ts'
import { write } from '../validation/validate-worktree-fixture-write.ts'
import { findMissingLedgerPages } from './find-missing-ledger-pages.ts'
import { wikiPages } from './wiki-pages.ts'
import { xThreadSourcePath } from './x-thread-source-path.ts'

describe('the audit readers with the wiki under brain/', () => {
  const { data, config } = nestedWikiConfig()
  write(data, 'brain/notes/a.md', '# A\n')
  write(data, 'brain/notes/deeper/b.md', '# B\n')
  write(data, 'notes/stray.md', '# not a page\n')
  write(data, 'brain/sources/survey.json', '{}\n')
  write(data, 'brain/captures/x/thread-42.json', '{}\n')
  const nested = <T>(body: () => T): T => withSyntopicaConfig(config, body)

  it('lists pages by page path and ignores a root-level lookalike', async () => {
    expect(await nested(async () => wikiPages(data))).toEqual([
      'notes/a.md',
      'notes/deeper/b.md',
    ])
  })

  it('resolves a sources: entry against the page root', () => {
    nested(() => {
      expect(resolveLocalSource(data, 'sources/survey.json')).toBe(
        `${data}/brain/sources/survey.json`,
      )
      expect(resolveLocalSource(data, '../syntopica.config.json')).toBeNull()
    })
  })

  it('finds a scraped thread under the configured sources directory', () => {
    nested(() => {
      expect(xThreadSourcePath(data, 'https://x.com/a/status/42')).toBe(
        `${data}/brain/captures/x/thread-42.json`,
      )
    })
  })

  it('checks a ledger page at its page path under the root', async () => {
    const findings = await nested(async () => findMissingLedgerPages(data, []))
    expect(findings).toEqual([])
  })
})
