import type { Clip } from '../clips/clip.ts'
import { FIXTURE_CLIP_ID } from './clip-state-fixture-clip-id.ts'

/** Builds a Clip fixture for the given bucket, with state overrides. */
export const clipFixture = (
  bucket: Clip['bucket'],
  overrides: Partial<Clip['state']> = {},
  directory = `/tmp/clip-${bucket}`,
): Clip =>
  ({
    kind: 'clip',
    directory,
    bucket,
    metadata: { clip_id: FIXTURE_CLIP_ID, clipped_at: '2026-07-26T19:07:35Z' },
    state: {
      status: 'pending',
      updatedAt: '',
      failure: null,
      brainCommit: null,
      ...overrides,
    },
  }) as unknown as Clip
