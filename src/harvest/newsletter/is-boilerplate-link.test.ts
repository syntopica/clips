import { describe, expect, it } from 'vitest'
import { isBoilerplateLink } from './is-boilerplate-link.ts'

describe('isBoilerplateLink', () => {
  it.each([
    'https://medium.com/@zulie_at_medium/work-at-medium-959d1a85284e',
    'https://policy.medium.com/medium-privacy-policy-f03bf92035c9',
    'https://policy.medium.com/medium-terms-of-service-9db0094a1e0f',
  ])('rejects the footer link %s, seen 178 times across 183 digests', (url) => {
    expect(isBoilerplateLink(url)).toBe(true)
  })

  it.each([
    'https://policy.medium.com/some-policy-page',
    'https://help.medium.com/hc/en-us',
    'https://medium.com/m/signin',
    'https://medium.com/plans',
    'https://medium.com/membership',
    'https://medium.com/about',
    'https://blog.medium.com/about',
    'https://medium.com/blog',
  ])('rejects the navigation link %s', (url) => {
    expect(isBoilerplateLink(url)).toBe(true)
  })

  it('keeps a real article', () => {
    expect(
      isBoilerplateLink(
        'https://medium.com/@joe.njenga/claude-code-ultraplan-launched-i-just-tested-it-and-its-better-than-it-looks-21a628332e97',
      ),
    ).toBe(false)
  })

  it('keeps an article whose slug merely mentions medium', () => {
    expect(
      isBoilerplateLink(
        'https://medium.com/@someone/why-i-left-medium-21a628332e97',
      ),
    ).toBe(false)
  })
})
