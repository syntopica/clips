import { describe, expect, it } from 'vitest'
import { sensitiveDiffRefusal } from './sensitive-diff-refusal.ts'

const header = (path: string): string =>
  `diff --git a/${path} b/${path}\n--- a/${path}\n+++ b/${path}\n+text\n`

describe('sensitiveDiffRefusal', () => {
  it('passes a diff that only touches public directories', () => {
    expect(sensitiveDiffRefusal(header('topics/nativephp.md'))).toBeNull()
  })

  it('refuses a diff touching a business page', () => {
    expect(sensitiveDiffRefusal(header('business/companies.md'))).toBe(
      'the diff touches a business/ page, which is never sent to an automatic reviewer',
    )
  })

  it('refuses when the sensitive page is one of several files', () => {
    const diff = header('topics/nativephp.md') + header('people/phil.md')
    expect(sensitiveDiffRefusal(diff)).toContain('people/')
  })

  it('reads file headers, not added text naming a directory', () => {
    const diff = `${header('topics/nativephp.md')}+see business/companies.md\n`
    expect(sensitiveDiffRefusal(diff)).toBeNull()
  })
})
