import { describe, expect, it, vi } from 'vitest'
import { fixture } from './ingest-test-fixture.ts'
import { options } from './ingest-test-options.ts'
import { PAGE_BODY } from './ingest-test-page-body.ts'
import { verdictReviewer } from './ingest-test-verdict-reviewer.ts'
import { writingSynthesizer } from './ingest-test-writing-synthesizer.ts'
import { ingest } from './ingest.ts'

/** Runs ingest with stdout captured and restores the stream even on failure. */
const reportedIngest = async (
  ingestOptions: Parameters<typeof ingest>[1],
): Promise<string> => {
  const { brain, clips } = fixture()
  const written: string[] = []
  const stdout = vi
    .spyOn(process.stdout, 'write')
    .mockImplementation((chunk: string | Uint8Array) => {
      written.push(String(chunk))
      return true
    })
  try {
    await ingest({ brain, clips }, ingestOptions, {
      synthesizer: writingSynthesizer(PAGE_BODY),
      grader: null,
      reviewer: verdictReviewer('skip'),
    })
  } finally {
    stdout.mockRestore()
  }
  return written.join('')
}

describe('clips ingest - summary output', () => {
  it('closes a run that changed nothing by saying so', async () => {
    expect(await reportedIngest(options)).toContain(
      '1 clips examined, nothing was ingested (1 skipped)',
    )
  })

  it('names a --clip filter that matched nothing', async () => {
    expect(
      await reportedIngest({ clipFilter: '01ZZZZZZ', dryRun: false }),
    ).toContain('no clip matched --clip 01ZZZZZZ; nothing was ingested')
  })
})
