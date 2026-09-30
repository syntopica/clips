import { describe, expect, it } from 'vitest'
import { workerPagePathRefusal } from './worker-page-path-refusal.ts'

const directories = ['brain/topics/', 'brain/projects/']
const NOT_PLAIN = 'not a plain relative path'

describe('workerPagePathRefusal', () => {
  it('accepts a markdown page inside a page directory', () => {
    expect(workerPagePathRefusal('brain/topics/a.md', directories)).toBeNull()
  })

  it.each([
    ['', NOT_PLAIN],
    ['/etc/passwd.md', NOT_PLAIN],
    ['brain/topics/../../x.md', NOT_PLAIN],
    ['brain/topics//a.md', NOT_PLAIN],
    ['brain/topics/a.txt', 'not a markdown page'],
    ['brain/index.md', 'outside the page directories'],
    ['brain/topicsx/a.md', 'outside the page directories'],
  ])('refuses %j', (path, reason) => {
    expect(workerPagePathRefusal(path, directories)).toContain(reason)
  })
})
