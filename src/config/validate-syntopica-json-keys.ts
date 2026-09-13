import { InvalidSyntopicaConfigError } from './invalid-syntopica-config-error.ts'

export function validateSyntopicaJsonKeys(text: string): void {
  const containers: (Set<string> | null)[] = []
  for (const token of text.matchAll(/"(?:[^"\\]|\\[\s\S])*"|[{}[\]]/gu)) {
    const value = token[0]
    if (value === '{') containers.push(new Set())
    else if (value === '[') containers.push(null)
    else if (value === '}' || value === ']') containers.pop()
    else if (/^\s*:/u.test(text.slice(token.index + value.length))) {
      const keys = containers.at(-1)
      const key = JSON.parse(value) as string
      if (keys?.has(key))
        throw new InvalidSyntopicaConfigError(
          'Configuration contains duplicate keys',
        )
      keys?.add(key)
    }
  }
}
