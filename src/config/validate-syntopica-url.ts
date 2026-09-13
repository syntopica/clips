import { InvalidSyntopicaConfigError } from './invalid-syntopica-config-error.ts'

export function validateSyntopicaUrl(value: string): void {
  try {
    const url = new URL(value)
    const userInfo = /^[^:]+:\/\/[^/?#]*@/u.test(value)
    const safeSsh =
      url.protocol === 'ssh:' &&
      url.username === 'git' &&
      value.startsWith('ssh://git@')
    if (url.password || (userInfo && !safeSsh) || url.search || url.hash) {
      throw new Error('Authenticated URL')
    }
  } catch {
    throw new InvalidSyntopicaConfigError(
      'Remote URL must not contain credentials or query strings',
    )
  }
}
