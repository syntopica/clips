import { describe, expect, it } from 'vitest'
import { formatIngestSummary } from './format-ingest-summary.ts'

describe('formatIngestSummary', () => {
  it('names the filter that matched no clip', () => {
    expect(formatIngestSummary(0, [], '01KYSGC2')).toBe(
      'no clip matched --clip 01KYSGC2; nothing was ingested\n',
    )
  })

  it('reports an empty store without a filter', () => {
    expect(formatIngestSummary(0, [], null)).toBe(
      'no clips to ingest; nothing was ingested\n',
    )
  })

  it('says nothing was ingested when every clip was examined and left alone', () => {
    expect(formatIngestSummary(3, ['skipped', 'stopped'], null)).toBe(
      '3 clips examined, nothing was ingested (1 skipped, 1 stopped)\n',
    )
  })

  it('says nothing was ingested when no clip reached the pipeline', () => {
    expect(formatIngestSummary(2, [], null)).toBe(
      '2 clips examined, nothing was ingested\n',
    )
  })

  it('breaks down a run that changed something', () => {
    expect(
      formatIngestSummary(4, ['published', 'published', 'skipped'], null),
    ).toBe('4 clips examined: 2 published, 1 skipped\n')
  })

  it('counts routing to needs-claude as a change', () => {
    expect(formatIngestSummary(1, ['needs-claude'], null)).toBe(
      '1 clips examined: 1 needs-claude\n',
    )
  })
})
