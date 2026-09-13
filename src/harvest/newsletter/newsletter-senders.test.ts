import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { loadSyntopicaConfig } from '../../config/load-syntopica-config.ts'
import { makeSyntopicaConfigFixture } from '../../testing/make-syntopica-config-fixture.ts'
import { newsletterSenderShapes } from './newsletter-sender-shapes.ts'
import { newsletterSendersRejectedBooking } from './newsletter-senders-rejected-booking.ts'
import { newsletterSendersRejected } from './newsletter-senders-rejected.ts'
import { newsletterSenders } from './newsletter-senders.ts'

describe('configured newsletter senders', () => {
  it('loads independent accepted shapes and rejected reasons from the selected instance', () => {
    const root = makeSyntopicaConfigFixture(
      mkdtempSync(join(tmpdir(), 'newsletter-config-')),
    )
    mkdirSync(join(root, '.config'))
    writeFileSync(
      join(root, '.config/newsletter-accepted.json'),
      JSON.stringify([
        ['digest@example.org', 'digest-links'],
        ['article@example.org', 'body-content'],
      ]),
    )
    writeFileSync(
      join(root, '.config/newsletter-rejected.json'),
      JSON.stringify([['alerts@example.org', 'Transient site alerts.']]),
    )
    writeFileSync(
      join(root, '.config/newsletter-rejected-booking.json'),
      JSON.stringify([['booking@example.org', 'Booking correspondence.']]),
    )
    const config = loadSyntopicaConfig(root, {})
    expect(newsletterSenders(config)).toEqual([
      'digest@example.org',
      'article@example.org',
    ])
    expect(newsletterSenderShapes(config).get('digest@example.org')).toBe(
      'digest-links',
    )
    expect(newsletterSenderShapes(config).get('article@example.org')).toBe(
      'body-content',
    )
    expect(newsletterSendersRejected(config).get('alerts@example.org')).toBe(
      'Transient site alerts.',
    )
    expect(newsletterSendersRejected(config).get('booking@example.org')).toBe(
      'Booking correspondence.',
    )
    expect(newsletterSendersRejectedBooking(config)).toEqual([
      ['booking@example.org', 'Booking correspondence.'],
    ])
  })
})
