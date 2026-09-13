import { describe, expect, it } from 'vitest'
import { urlTopicWords } from './url-topic-words.ts'

describe('urlTopicWords', () => {
  it('reads the headline out of a Medium slug and drops the hex id', () => {
    expect(
      urlTopicWords(
        'https://medium.com/@mayhemcode/the-7-ollama-commands-that-separate-hobbyists-from-power-users-99a70ab45924',
      ),
    ).toBe('the 7 ollama commands that separate hobbyists from power users')
  })

  it('ignores query strings and fragments', () => {
    expect(
      urlTopicWords(
        'https://medium.com/@a/run-aws-locally-abc123def456?source=rss#top',
      ),
    ).toBe('run aws locally')
  })

  it('returns an empty string when the path carries no words', () => {
    expect(urlTopicWords('https://example.com/')).toBe('')
  })
})
