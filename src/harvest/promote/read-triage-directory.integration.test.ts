import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { temporaryDir } from '../../testing/temporary-dir.ts'
import { readTriageDirectory } from './read-triage-directory.ts'

describe('readTriageDirectory', () => {
  it('takes the topic from the filename stem of every topic file', () => {
    const directory = temporaryDir('promote-')
    writeFileSync(
      join(directory, 'ai-agents.md'),
      '- [x] [Agents](https://medium.com/@a/agents-000000000001) - why.\n',
    )
    writeFileSync(
      join(directory, 'seo.md'),
      '- [X] [Search](https://medium.com/@a/search-000000000002) - why.\n',
    )

    expect(
      readTriageDirectory(directory).toSorted((a, b) =>
        a.topic.localeCompare(b.topic),
      ),
    ).toEqual([
      {
        url: 'https://medium.com/@a/agents-000000000001',
        title: 'Agents',
        topic: 'ai-agents',
      },
      {
        url: 'https://medium.com/@a/search-000000000002',
        title: 'Search',
        topic: 'seo',
      },
    ])
  })

  it('skips README.md, which is the run index and not a topic', () => {
    const directory = temporaryDir('promote-')
    writeFileSync(
      join(directory, 'README.md'),
      '- [x] [Index link](https://example.com/index) - not an article.\n',
    )
    writeFileSync(
      join(directory, 'saas.md'),
      '- [x] [Real](https://medium.com/@a/real-000000000003) - why.\n',
    )

    expect(readTriageDirectory(directory)).toEqual([
      {
        url: 'https://medium.com/@a/real-000000000003',
        title: 'Real',
        topic: 'saas',
      },
    ])
  })

  it('returns nothing when a run exists but was left untouched', () => {
    const directory = temporaryDir('promote-')
    writeFileSync(
      join(directory, 'other.md'),
      '- [ ] [Untouched](https://medium.com/@a/untouched-000000000004) - why.\n',
    )

    expect(readTriageDirectory(directory)).toEqual([])
  })

  it('names the missing directory rather than looking like nothing was ticked', () => {
    const missing = join(temporaryDir('promote-'), '2026-07-30')

    expect(() => readTriageDirectory(missing)).toThrow(missing)
  })
})
