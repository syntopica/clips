import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { temporaryDir } from '../../testing/temporary-dir.ts'
import type { TriagedArticle } from './triaged-article.ts'
import { writeTriageOutput } from './write-triage-output.ts'

/** The triage run date every output here is written for. */
const RUN_DATE = '2026-07-29'

const article = (overrides: Partial<TriagedArticle>): TriagedArticle => ({
  url: 'https://medium.com/@a/one-000000000001',
  title: 'One',
  firstSeen: '2026-07-28',
  bucket: 'ingest',
  topic: 'ai-agents',
  reason: 'why',
  ...overrides,
})

describe('writeTriageOutput', () => {
  it('writes one file per non-empty topic plus a README', () => {
    const brain = temporaryDir('triage-')
    const directory = writeTriageOutput({
      brainRepository: brain,
      date: RUN_DATE,
      emailCount: 183,
      linkCount: 4835,
      articles: [
        article({ topic: 'ai-agents' }),
        article({
          topic: 'devtools',
          url: 'https://medium.com/@a/two-000000000002',
        }),
      ],
    })

    expect(readdirSync(directory).toSorted()).toEqual([
      'README.md',
      'ai-agents.md',
      'devtools.md',
    ])
  })

  it('lands under the gitignored inbox drop zone, dated per run', () => {
    const brain = temporaryDir('triage-')
    const directory = writeTriageOutput({
      brainRepository: brain,
      date: RUN_DATE,
      emailCount: 1,
      linkCount: 1,
      articles: [article({})],
    })

    expect(directory).toBe(join(brain, 'inbox', 'newsletter-triage', RUN_DATE))
  })

  it('reports the deduplication ratio the run actually achieved', () => {
    const brain = temporaryDir('triage-')
    const directory = writeTriageOutput({
      brainRepository: brain,
      date: RUN_DATE,
      emailCount: 183,
      linkCount: 4835,
      articles: [article({})],
    })
    const readme = readFileSync(join(directory, 'README.md'), 'utf8')

    expect(readme).toContain('1 unique articles from 183 digest emails')
    expect(readme).toContain('4835 article links extracted, 100% removed')
  })

  it('keeps a hand-applied [gone-410] marker across a re-run', () => {
    const brain = temporaryDir('triage-')
    const request = {
      brainRepository: brain,
      date: RUN_DATE,
      emailCount: 1,
      linkCount: 2,
      articles: [
        article({ bucket: 'review' as const }),
        article({
          bucket: 'review' as const,
          url: 'https://medium.com/@a/two-000000000002',
          title: 'Two',
        }),
      ],
    }
    const directory = writeTriageOutput(request)
    const file = join(directory, 'ai-agents.md')
    writeFileSync(
      file,
      readFileSync(file, 'utf8').replace(
        '- [ ] [One](https://medium.com/@a/one-000000000001)',
        '- [gone-410] [One](https://medium.com/@a/one-000000000001)',
      ),
      'utf8',
    )

    writeTriageOutput(request)
    const rewritten = readFileSync(file, 'utf8')

    expect(rewritten).toContain(
      '- [gone-410] [One](https://medium.com/@a/one-000000000001) - why',
    )
    expect(rewritten).toContain(
      '- [ ] [Two](https://medium.com/@a/two-000000000002) - why',
    )
  })

  it('links only the topics that have articles', () => {
    const brain = temporaryDir('triage-')
    const directory = writeTriageOutput({
      brainRepository: brain,
      date: RUN_DATE,
      emailCount: 1,
      linkCount: 1,
      articles: [article({ topic: 'saas' })],
    })
    const readme = readFileSync(join(directory, 'README.md'), 'utf8')

    expect(readme).toContain('[saas](saas.md)')
    expect(readme).not.toContain('[seo](seo.md)')
  })
})
