import { describe, expect, it } from 'vitest'
import { localGradeOverflow } from './local-grade-overflow.ts'

describe('localGradeOverflow', () => {
  const local = { provider: 'ollama', model: 'qwen3.6:35b' }

  it('discards a local answer to a prompt over its window', () => {
    // 40960 tokens at three bytes each holds 120 KB; Ollama would have cut
    // the head of a 200 KB prompt, sources first.
    expect(localGradeOverflow(local, 200 * 1024, 40_960)).toMatch(/cannot hold/)
  })

  it('keeps a local answer to a prompt that fit', () => {
    expect(localGradeOverflow(local, 50 * 1024, 40_960)).toBeNull()
  })

  it('never judges a remote answer by the local window', () => {
    expect(
      localGradeOverflow({ provider: 'agy', model: '' }, 400 * 1024, 40_960),
    ).toBeNull()
  })
})
