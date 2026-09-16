import { expect, it } from 'vitest'
import { partitionInboxClips } from './partition-inbox-clips.ts'

it('keeps a clip the archive holds under any bucket out of the fresh set', () => {
  const pending = [
    'clips/pending/2026/09/2026-09-16-a-01k0000a',
    'clips/pending/2026/09/2026-09-16-b-01k0000b',
  ]
  expect(
    partitionInboxClips(pending, new Set(['2026-09-16-b-01k0000b'])),
  ).toEqual({
    fresh: ['clips/pending/2026/09/2026-09-16-a-01k0000a'],
    duplicates: ['clips/pending/2026/09/2026-09-16-b-01k0000b'],
  })
})
