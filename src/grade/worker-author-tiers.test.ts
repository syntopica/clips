import { describe, expect, it } from 'vitest'
import { workerAuthorTiers } from './worker-author-tiers.ts'

describe('workerAuthorTiers', () => {
  it('places a local backend in the local tier', () => {
    // The page's author is a local model: no existing grader shares it, and a
    // local grader added later would be refused.
    expect(workerAuthorTiers('worker:ollama/qwen3.6:35b')).toEqual(['local'])
  })

  it('places a runner CLI in the tier that CLI grades on', () => {
    expect(workerAuthorTiers('worker:codex/gpt-5.5')).toEqual(['codex'])
    expect(workerAuthorTiers('worker:cursor/composer-2.5')).toEqual(['cursor'])
    expect(workerAuthorTiers('worker:agy/any')).toEqual([
      'agy-fine',
      'agy-bulk',
    ])
  })

  it('does not place an unreported or unknown executor', () => {
    expect(workerAuthorTiers('worker:unreported')).toBeNull()
    expect(workerAuthorTiers('worker:vllm/x')).toBeNull()
    expect(workerAuthorTiers('qwen3.6:35b')).toBeNull()
  })
})
