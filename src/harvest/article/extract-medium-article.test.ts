import { describe, expect, it } from 'vitest'
import { extractMediumArticle } from './extract-medium-article.ts'
import { MEDIUM_ARTICLE_FIXTURE } from './medium-article-fixture.ts'

describe('extractMediumArticle', () => {
  it('reads the metadata off the Post entry', () => {
    const article = extractMediumArticle(MEDIUM_ARTICLE_FIXTURE)

    expect(article.title).toBe(
      'GLM-5.2 Is Free Right Now, No API Key Needed, and It Surprised Me',
    )
    expect(article.url).toBe(
      'https://nitingavhane.medium.com/glm-5-2-is-free-right-now-no-api-key-needed-and-it-surprised-me-653632330ba9',
    )
    expect(article.isLocked).toBe(true)
  })

  it('resolves the author through the creator reference', () => {
    expect(extractMediumArticle(MEDIUM_ARTICLE_FIXTURE).author).toBe(
      'Nitin Gavhane',
    )
  })

  it('renders the whole body in document order, blocks separated by a blank line', () => {
    expect(extractMediumArticle(MEDIUM_ARTICLE_FIXTURE).body).toBe(
      [
        'Hi everyone, I am Nitin Gavhane and in this blog I want to walk you through GLM-5.2, the new open-weight model from Z.ai. I’ll keep this simple and practical: what it actually does, a real example I ran myself, and a step-by-step way to try it for free, whether or not you know how to code.',
        '![](https://miro.medium.com/v2/1*zoeJufKxo3PHcjZcWyByZQ.png)',
        '### What GLM-5.2 actually is',
        '- **Context window:** about 1 million tokens. That’s the amount of text it can “hold in mind” during one conversation, roughly five times more than the previous GLM version.',
        '1. Go to [Mira](https://agentmira.io/) and create a free account.',
        '1. Go to Hugging Face and find `zai-org/GLM-5.2`.',
        '```typescript\npip install transformers torch accelerate\n```',
        '```python\nfrom transformers import AutoModelForCausalLM, AutoTokenizer\n\n   model_name = "zai-org/GLM-5.2"\n   tokenizer = AutoTokenizer.from_pretrained(model_name)\n   model = AutoModelForCausalLM.from_pretrained(model_name)\n```',
      ].join('\n\n'),
    )
  })

  it('drops the leading paragraph that repeats the title', () => {
    const article = extractMediumArticle(MEDIUM_ARTICLE_FIXTURE)

    expect(article.body).not.toContain(`### ${article.title}`)
    expect(article.body.startsWith('Hi everyone')).toBe(true)
  })

  it('keeps a leading heading that is not the title', () => {
    const renamed = MEDIUM_ARTICLE_FIXTURE.replace(
      '"title":"GLM-5.2 Is Free Right Now, No API Key Needed, and It Surprised Me"',
      '"title":"A different title"',
    )

    expect(extractMediumArticle(renamed).body.startsWith('### GLM-5.2')).toBe(
      true,
    )
  })

  it('leaves no blank block where a paragraph rendered empty', () => {
    expect(extractMediumArticle(MEDIUM_ARTICLE_FIXTURE).body).not.toContain(
      '\n\n\n',
    )
  })

  it('throws when the page carries no Post entry', () => {
    const withoutPost = MEDIUM_ARTICLE_FIXTURE.replace(
      '"Post:653632330ba9":{',
      '"Draft:653632330ba9":{',
    )

    expect(() => extractMediumArticle(withoutPost)).toThrow(
      /No "Post:<id>" entry/,
    )
  })

  it('throws when the page carries no Apollo state at all', () => {
    expect(() =>
      extractMediumArticle('<html><body>nope</body></html>'),
    ).toThrow(/signed out or this URL is not an article/)
  })

  it('reports a null author when the creator is not cached', () => {
    const withoutUser = MEDIUM_ARTICLE_FIXTURE.replace(
      '"User:a04624a1a0b":{',
      '"Person:a04624a1a0b":{',
    )

    expect(extractMediumArticle(withoutUser).author).toBeNull()
  })
})
