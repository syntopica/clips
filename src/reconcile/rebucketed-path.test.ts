import { describe, expect, it } from 'vitest'
import { rebucketedPath } from './rebucketed-path.ts'

describe('rebucketedPath', () => {
  it('keeps the year, month and directory name', () => {
    expect(
      rebucketedPath('clips/pending/2026/08/a-clip', 'pending', 'processed'),
    ).toBe('clips/processed/2026/08/a-clip')
  })

  it('runs the other way, which is what requeue needs', () => {
    expect(
      rebucketedPath(
        'clips/needs-claude/2026/08/a-clip',
        'needs-claude',
        'pending',
      ),
    ).toBe('clips/pending/2026/08/a-clip')
  })

  it('throws when the path is not under the source bucket', () => {
    // The old code did this by noticing the string replace changed nothing,
    // which only worked while every move started from pending.
    expect(() =>
      rebucketedPath('clips/processed/2026/08/a-clip', 'pending', 'processed'),
    ).toThrow(/is not under clips\/pending\//)
  })

  it('does not rewrite a bucket name appearing deeper in the path', () => {
    expect(
      rebucketedPath(
        'clips/needs-claude/2026/08/pending-review',
        'needs-claude',
        'pending',
      ),
    ).toBe('clips/pending/2026/08/pending-review')
  })
})
