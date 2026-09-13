import { describe, expect, it } from 'vitest'
import { sensitivePageRefusal } from './sensitive-page-refusal.ts'

describe('sensitivePageRefusal', () => {
  it('refuses a business page, which is where the credentials are', () => {
    // business/companies.md carries eleven passwords, API keys and account
    // numbers, and was gradeable - and therefore transmittable - until this.
    expect(sensitivePageRefusal('business/companies.md')).toMatch(/refused/)
  })

  it('refuses personal and people pages', () => {
    expect(sensitivePageRefusal('personal/chatgpt-corpus.md')).toMatch(
      /refused/,
    )
    expect(sensitivePageRefusal('people/someone.md')).toMatch(/refused/)
  })

  it('allows topics and projects, which are written from public captures', () => {
    // The grader's whole job is checking these against the clips they cite, and
    // those clips came off the public web to begin with.
    expect(sensitivePageRefusal('topics/agent-harnesses.md')).toBeNull()
    expect(sensitivePageRefusal('projects/brain.md')).toBeNull()
  })

  it('names what to do instead, so the refusal is not a dead end', () => {
    expect(sensitivePageRefusal('business/companies.md')).toMatch(
      /last_verified/,
    )
  })

  it('does not match a directory name appearing later in the path', () => {
    expect(sensitivePageRefusal('topics/business-models.md')).toBeNull()
  })
})
