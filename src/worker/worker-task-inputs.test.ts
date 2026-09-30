import { describe, expect, it } from 'vitest'
import { workerTaskInputs } from './worker-task-inputs.ts'

describe('workerTaskInputs', () => {
  it('turns absolute paths into a manifest relative to the instance', () => {
    expect(
      workerTaskInputs('/data', [
        '/data/brain/topics/a.md',
        '/data/clips/b.md',
      ]),
    ).toEqual(['brain/topics/a.md', 'clips/b.md'])
  })

  it('names a file outside the instance instead of sending it', () => {
    expect(workerTaskInputs('/data', ['/elsewhere/c.md'])).toMatch(
      /elsewhere\/c\.md is outside the instance/,
    )
    expect(workerTaskInputs('/data', ['/data'])).toMatch(/outside/)
  })

  it('refuses a manifest longer than the worker accepts', () => {
    const paths = Array.from(
      { length: 65 },
      (_, index) => `/data/${String(index)}`,
    )
    expect(workerTaskInputs('/data', paths)).toMatch(/65 files exceed/)
  })
})
