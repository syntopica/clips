import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { checkoutRoot } from '../testing/checkout-root.ts'
import { temporaryDir } from '../testing/temporary-dir.ts'
import { prettierText } from './prettier-text.ts'

/** The checkout that runs these tests. The point of them is that the CLI
 * reproduces that checkout's own prettier config - a fixture config would prove
 * nothing about `pnpm run check`. */
const BRAIN = checkoutRoot()

describe('prettierText', () => {
  it('wraps prose in a page, which is the *.md config override', async () => {
    const long =
      '# Title\n\nthis is a very long line of prose that should be wrapped by prettier because proseWrap is always and the print width is eighty characters.\n'
    expect(await prettierText(BRAIN, 'topics/example.md', long)).toBe(
      '# Title\n\nthis is a very long line of prose that should be wrapped by prettier because\nproseWrap is always and the print width is eighty characters.\n',
    )
  })

  it('collapses a short array in a ledger, which JSON.stringify does not', async () => {
    const ledger = `${JSON.stringify({ pagesTouched: ['topics/a.md'] }, null, 2)}\n`
    expect(await prettierText(BRAIN, '.ingest/clips/01K.json', ledger)).toBe(
      '{\n  "pagesTouched": ["topics/a.md"]\n}\n',
    )
  })

  it('leaves text that is already formatted byte-identical', async () => {
    const page = '# Title\n\nShort enough.\n'
    expect(await prettierText(BRAIN, 'topics/example.md', page)).toBe(page)
  })

  it("leaves a path the repository's .prettierignore excludes as written", async () => {
    // 2026-10-05: the wiki keeps brain/ outside its formatter, and an ingest
    // reflowed its one-line index entries across 883 lines regardless.
    const repository = temporaryDir('clips-prettier-')
    writeFileSync(join(repository, '.prettierignore'), 'brain/\n')
    const long = `- [[topics/a]] — ${'word '.repeat(30)}\n`

    expect(await prettierText(repository, 'brain/index.md', long)).toBe(long)
  })
})
