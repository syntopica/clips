import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { countExistingTriage } from './count-existing-triage.ts'

const roots: string[] = []
afterAll(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true })
})
const temporary = (): string => {
  const root = mkdtempSync(join(tmpdir(), 'triage-count-'))
  roots.push(root)
  mkdirSync(root, { recursive: true })
  return root
}

describe('countExistingTriage', () => {
  it('counts nothing when no run exists', () => {
    expect(countExistingTriage(join(tmpdir(), 'no-such-triage-run'))).toBe(0)
  })

  it('counts entries whether or not they carry a checkbox', () => {
    const directory = temporary()
    writeFileSync(
      join(directory, 'ai-agents.md'),
      '# ai-agents\n\n## Ingest (1)\n\n- [One](https://medium.com/a-000000000001) - why\n\n' +
        '## Review (2)\n\n- [ ] [Two](https://medium.com/b-000000000002) - why\n' +
        '- [x] [Three](https://medium.com/c-000000000003) - why\n',
      'utf8',
    )

    expect(countExistingTriage(directory)).toBe(3)
  })

  it('ignores the README, which is the index rather than a topic', () => {
    const directory = temporary()
    writeFileSync(
      join(directory, 'README.md'),
      '- [ai-agents](ai-agents.md)\n- [saas](saas.md)\n',
      'utf8',
    )

    expect(countExistingTriage(directory)).toBe(0)
  })

  it('sums across topic files', () => {
    const directory = temporary()
    writeFileSync(
      join(directory, 'saas.md'),
      '- [One](https://medium.com/a-000000000001) - x\n',
      'utf8',
    )
    writeFileSync(
      join(directory, 'seo.md'),
      '- [Two](https://medium.com/b-000000000002) - x\n',
      'utf8',
    )

    expect(countExistingTriage(directory)).toBe(2)
  })
})
