import { describe, expect, it } from 'vitest'
import { isCodexOutOfCredits } from './is-codex-out-of-credits.ts'

const CREDIT_WALL =
  'ERROR: Your workspace is out of credits. Ask your workspace owner to refill in order to continue.'

describe('isCodexOutOfCredits', () => {
  it('detects the wall on stderr', () => {
    expect(isCodexOutOfCredits('', CREDIT_WALL)).toBe(true)
  })

  it('detects the wall on stdout, where codex has also printed it', () => {
    expect(isCodexOutOfCredits(CREDIT_WALL, '')).toBe(true)
  })

  it('ignores case', () => {
    expect(isCodexOutOfCredits('', CREDIT_WALL.toUpperCase())).toBe(true)
  })

  it('says no for a clean run', () => {
    expect(isCodexOutOfCredits('{"verdicts":[]}', '')).toBe(false)
  })

  it('says no for the failures that must degrade to review instead', () => {
    // Switching model on these would change who classified a batch for a
    // reason that a retry could have cleared.
    expect(isCodexOutOfCredits('', 'error: timed out after 600s')).toBe(false)
    expect(isCodexOutOfCredits('', 'Killed: 9')).toBe(false)
    expect(isCodexOutOfCredits('', 'rate limit exceeded, retry in 60s')).toBe(
      false,
    )
    expect(isCodexOutOfCredits('', 'stream error: connection reset')).toBe(
      false,
    )
  })

  it('does not fire on an article title that merely mentions credits', () => {
    // codex echoes the prompt on stdout, so untrusted titles are scanned here.
    expect(
      isCodexOutOfCredits('How I ran out of credits on OpenAI in a week', ''),
    ).toBe(false)
    expect(
      isCodexOutOfCredits('0\tYour workspace is out of credits\tsome slug', ''),
    ).toBe(false)
  })
})
