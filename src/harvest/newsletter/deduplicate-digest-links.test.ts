import { describe, expect, it } from 'vitest'
import type { DatedDigestLink } from './dated-digest-link.ts'
import { deduplicateDigestLinks } from './deduplicate-digest-links.ts'

const ULTRAPLAN =
  'https://medium.com/@joe.njenga/claude-code-ultraplan-launched-i-just-tested-it-and-its-better-than-it-looks-21a628332e97'
const RAG =
  'https://medium.com/data-science/why-your-rag-pipeline-is-slower-than-it-should-be-959d1a85284e'

const TITLE = 'Claude Code UltraPlan launched'
const SUBTITLE =
  'The planning mode nobody asked for turned out to be the one that matters'
const RAG_TITLE = 'Why your RAG pipeline is slow'

const LATE = '2026-07-28'
const MIDDLE = '2026-07-26'
const EARLY = '2026-07-25'

const DIGEST = 'noreply@medium.com'
const NEWSLETTER = 'newsletters@medium.com'

const link = (
  url: string,
  title: string,
  date: string,
  overrides: { sender?: string; headingLevel?: number | null } = {},
): DatedDigestLink => ({
  url,
  title,
  date,
  sender: overrides.sender ?? DIGEST,
  headingLevel: overrides.headingLevel ?? null,
})

describe('deduplicateDigestLinks', () => {
  it('collapses the title and subtitle pair of one digest into one article', () => {
    expect(
      deduplicateDigestLinks([
        link(ULTRAPLAN, TITLE, LATE),
        link(ULTRAPLAN, SUBTITLE, LATE),
      ]),
    ).toEqual([
      {
        url: ULTRAPLAN,
        title: SUBTITLE,
        firstSeen: LATE,
        sender: DIGEST,
        count: 2,
      },
    ])
  })

  it('keeps the earliest date and its sender when a digest repeats an article', () => {
    expect(
      deduplicateDigestLinks([
        link(RAG, RAG_TITLE, LATE),
        link(RAG, RAG_TITLE, EARLY, { sender: NEWSLETTER }),
        link(RAG, RAG_TITLE, MIDDLE),
      ]),
    ).toEqual([
      {
        url: RAG,
        title: RAG_TITLE,
        firstSeen: EARLY,
        sender: NEWSLETTER,
        count: 3,
      },
    ])
  })

  it('returns newest firstSeen first', () => {
    expect(
      deduplicateDigestLinks([
        link(RAG, RAG_TITLE, EARLY),
        link(ULTRAPLAN, TITLE, LATE),
      ]).map((article) => article.url),
    ).toEqual([ULTRAPLAN, RAG])
  })

  it('collapses two URL spellings of one post, keeping the first seen', () => {
    const subdomain = ULTRAPLAN.replace(
      'https://medium.com/@joe.njenga/',
      'https://joe-njenga.medium.com/',
    )

    expect(
      deduplicateDigestLinks([
        link(ULTRAPLAN, TITLE, LATE),
        link(subdomain, TITLE, MIDDLE),
      ]),
    ).toEqual([
      {
        url: ULTRAPLAN,
        title: TITLE,
        firstSeen: MIDDLE,
        sender: DIGEST,
        count: 2,
      },
    ])
  })

  it('returns an empty list for no links', () => {
    expect(deduplicateDigestLinks([])).toEqual([])
  })

  it('keeps the heading title over a longer subtitle, the 22% case', () => {
    const [article] = deduplicateDigestLinks([
      link(ULTRAPLAN, TITLE, LATE, { headingLevel: 2 }),
      link(
        ULTRAPLAN,
        `${SUBTITLE} padded out to be much longer than the title`,
        LATE,
        { headingLevel: 3 },
      ),
    ])

    expect(article?.title).toBe(TITLE)
  })
})
