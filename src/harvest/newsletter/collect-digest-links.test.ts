import { describe, expect, it } from 'vitest'
import type { BodyHeader } from './body-header.ts'
import { collectDigestLinks } from './collect-digest-links.ts'
import type { DigestBody } from './digest-body.ts'
import type { SenderShape } from './sender-shape.ts'

/** The allowlist is instance data since 2026-09-13, so the collector takes it
 * as an argument. These four senders are the ones this file exercises. */
const MEDIUM_SENDER = 'noreply@medium.com'
const MEDIUM_NEWSLETTER_SENDER = 'newsletters@medium.com'
const BODY_SENDER = 'author@digest.example'
const OPENAI_SENDER = 'noreply@email.openai.com'

const SENDER_SHAPES: ReadonlyMap<string, SenderShape> = new Map([
  [MEDIUM_SENDER, 'digest-links'],
  [MEDIUM_NEWSLETTER_SENDER, 'digest-links'],
  [BODY_SENDER, 'body-content'],
  [OPENAI_SENDER, 'body-content'],
])
const DIGEST_DATE = '2026-07-28'

const fromMedium = (sender: string, bodies: DigestBody[]): DigestBody[] =>
  sender === MEDIUM_SENDER ? bodies : []

const noBodies = (): BodyHeader[] => []

const noDigests = (): DigestBody[] => []

describe('collectDigestLinks', () => {
  it('deduplicates one article seen in two different digests', () => {
    const url = 'https://medium.com/@a/agent-memory-000000000001'
    const result = collectDigestLinks({
      readDigests: (sender) =>
        fromMedium(sender, [
          { date: DIGEST_DATE, body: `## [Agent Memory](${url}?source=a)` },
          { date: '2026-07-20', body: `## [Agent Memory](${url}?source=b)` },
        ]),
      readBodyHeaders: noBodies,
      senderShapes: SENDER_SHAPES,
    })

    expect(result.linkCount).toBe(2)
    expect(result.articles).toHaveLength(1)
    expect(result.articles[0]?.count).toBe(2)
    expect(result.articles[0]?.firstSeen).toBe('2026-07-20')
  })

  it('counts every scanned email, including senders with no mail', () => {
    const result = collectDigestLinks({
      readDigests: (sender) =>
        fromMedium(sender, [{ date: DIGEST_DATE, body: '' }]),
      readBodyHeaders: noBodies,
      senderShapes: SENDER_SHAPES,
    })

    expect(result.emailCount).toBe(1)
    expect(result.articles).toEqual([])
  })

  it('drops Medium footer links that appear in every digest', () => {
    const result = collectDigestLinks({
      readDigests: (sender) =>
        fromMedium(sender, [
          {
            date: DIGEST_DATE,
            body:
              '[Work at Medium](https://medium.com/@z/work-at-medium-959d1a85284e)\n' +
              '[Real Article](https://medium.com/@a/real-article-000000000009)',
          },
        ]),
      readBodyHeaders: noBodies,
      senderShapes: SENDER_SHAPES,
    })

    expect(result.articles).toHaveLength(1)
    expect(result.articles[0]?.title).toBe('Real Article')
  })

  it('reads one body at a time rather than collecting the sender first', () => {
    const live: string[] = []
    const result = collectDigestLinks({
      readDigests: function* (sender) {
        if (sender !== MEDIUM_SENDER) return
        for (const index of [1, 2, 3]) {
          live.push(`body-${String(index)}`)
          yield {
            date: DIGEST_DATE,
            body: `## [Article Number ${String(index)}](https://medium.com/@a/post-00000000000${String(index)})`,
          }
        }
      },
      readBodyHeaders: noBodies,
      senderShapes: SENDER_SHAPES,
    })

    // The generator only advances as the collector consumes, so all three
    // bodies exist by the end but never at once.
    expect(live).toHaveLength(3)
    expect(result.articles).toHaveLength(3)
  })

  it('turns a body-content message into one article with a vexa identity', () => {
    const result = collectDigestLinks({
      readDigests: noDigests,
      readBodyHeaders: (sender) =>
        sender === BODY_SENDER
          ? [{ date: '2026-08-06', subject: 'How to  Serve\n5 Models' }]
          : [],
      senderShapes: SENDER_SHAPES,
    })

    expect(result.articles).toHaveLength(1)
    expect(result.articles[0]?.title).toBe('How to Serve 5 Models')
    expect(result.articles[0]?.url).toBe(
      'vexa://digest.example/author/how-to-serve-5-models',
    )
    expect(result.articles[0]?.sender).toBe(BODY_SENDER)
  })

  it('collapses a resent body-content announcement to one article', () => {
    // Measured: OpenAI sent one announcement three times, three message ids,
    // one subject. Sender+slug identity makes the resends one candidate.
    const result = collectDigestLinks({
      readDigests: noDigests,
      readBodyHeaders: (sender) =>
        sender === OPENAI_SENDER
          ? [
              { date: '2026-07-30', subject: 'Lower GPT-5.6 pricing' },
              { date: '2026-07-31', subject: 'Lower GPT-5.6 pricing' },
              { date: '2026-07-31', subject: 'Lower GPT-5.6 pricing' },
            ]
          : [],
      senderShapes: SENDER_SHAPES,
    })

    expect(result.linkCount).toBe(3)
    expect(result.articles).toHaveLength(1)
    expect(result.articles[0]?.count).toBe(3)
    expect(result.articles[0]?.firstSeen).toBe('2026-07-30')
  })

  it('never asks a body-content sender for digest bodies, nor the reverse', () => {
    const digestAsked: string[] = []
    const bodyAsked: string[] = []
    collectDigestLinks({
      readDigests: (sender) => {
        digestAsked.push(sender)
        return []
      },
      readBodyHeaders: (sender) => {
        bodyAsked.push(sender)
        return []
      },
      senderShapes: SENDER_SHAPES,
    })

    expect(digestAsked).toEqual([MEDIUM_SENDER, MEDIUM_NEWSLETTER_SENDER])
    expect(bodyAsked).toContain(BODY_SENDER)
    expect(bodyAsked).not.toContain(MEDIUM_SENDER)
  })
})
