import { describe, expect, it } from 'vitest'
import { pageHeadings } from './page-headings.ts'

describe('pageHeadings', () => {
  it('reads every heading level', () => {
    const page = ['# Title', 'body', '## One', 'body', '### Two'].join('\n')

    expect(pageHeadings(page)).toEqual(['Title', 'One', 'Two'])
  })

  it('ignores a comment inside a fenced block', () => {
    // Wiki pages quote shell sessions constantly; counting `# install deps` as
    // a section would make a page's shape depend on its examples.
    const page = [
      '## Real section',
      '',
      '```bash',
      '# install deps',
      'pnpm install',
      '```',
      '',
      '## Another',
    ].join('\n')

    expect(pageHeadings(page)).toEqual(['Real section', 'Another'])
  })

  it('does not read a hash that is not a heading', () => {
    expect(pageHeadings('#no-space is a fragment, not a heading')).toEqual([])
  })
})
