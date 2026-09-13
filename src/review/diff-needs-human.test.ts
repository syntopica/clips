import { describe, expect, it } from 'vitest'
import { diffNeedsHuman } from './diff-needs-human.ts'

const NEW_PAGE = [
  'diff --git a/topics/brand-new.md b/topics/brand-new.md',
  'new file mode 100644',
  '--- /dev/null',
  '+++ b/topics/brand-new.md',
  '+# brand new',
].join('\n')

const indexDiff = (...body: string[]): string =>
  [
    'diff --git a/index.md b/index.md',
    'index 1111111..2222222 100644',
    '--- a/index.md',
    '+++ b/index.md',
    '@@ -10,6 +10,7 @@',
    ...body,
  ].join('\n')

describe('diffNeedsHuman', () => {
  it('lets an addition to an existing page through', () => {
    const diff = [
      'diff --git a/topics/claude-code-practice.md b/topics/claude-code-practice.md',
      '--- a/topics/claude-code-practice.md',
      '+++ b/topics/claude-code-practice.md',
      '+  Arize AI research cites under 100 lines [[S121]](#sources).',
    ].join('\n')

    expect(diffNeedsHuman(diff)).toBeNull()
  })

  it('lets a new page through', () => {
    // The wiki is young: new topics are the ordinary case. An orphan page is
    // refused by validation before review, and whether the page is warranted is
    // a judgement the reviewer's criteria carry.
    expect(diffNeedsHuman(NEW_PAGE)).toBeNull()
  })

  it('lets a new page add its own index entry', () => {
    const diff = [
      NEW_PAGE,
      indexDiff('+- [[topics/brand-new]] - a new topic'),
    ].join('\n')

    expect(diffNeedsHuman(diff)).toBeNull()
  })

  it('reserves a diff that drops a page from the index', () => {
    const diff = indexDiff(
      '-- [[topics/old]] - gone',
      '+- [[topics/new]] - here',
    )

    expect(diffNeedsHuman(diff)).toBe('the diff drops topics/old from index.md')
  })

  it('lets a regenerated entry through when the page keeps its line', () => {
    // The root map is derived from `summary:`, so a clip that extends an
    // existing page rewrites that page's entry and prettier rewraps it. The
    // page is still listed; nothing was lost. This shape sent 45 clips to
    // needs-claude in the 2026-08-24/25 auto-review batches.
    const diff = indexDiff(
      '-- [[topics/reinforcement-learning]] - model-free RL, Monte Carlo, SARSA,',
      '-  Q-learning, and the role of RL in LLM reasoning (GRPO)',
      '+- [[topics/reinforcement-learning]] - model-free RL, Monte Carlo, SARSA,',
      '+  Q-learning, and the role of RL in LLM reasoning (GRPO, RLVR, DeepSeek-R1)',
    )

    expect(diffNeedsHuman(diff)).toBeNull()
  })

  it('lets a rewrapped continuation line through', () => {
    const diff = indexDiff(
      '-  but does nothing, upgrades breaking loops, the review bottleneck',
      '+  but does nothing, upgrades breaking loops, the review bottleneck, and a',
      '+  multi-layered detector that convicts on tool source',
    )

    expect(diffNeedsHuman(diff)).toBeNull()
  })

  it('reserves a diff that removes a section heading', () => {
    const diff = indexDiff('-## Topics')

    expect(diffNeedsHuman(diff)).toBe(
      'the diff removes a section heading from index.md',
    )
  })

  it('does not read another file’s deletions as index changes', () => {
    const diff = [
      'diff --git a/topics/a.md b/topics/a.md',
      '--- a/topics/a.md',
      '+++ b/topics/a.md',
      '-a removed sentence',
      indexDiff('+- [[topics/a]] - still here'),
    ].join('\n')

    expect(diffNeedsHuman(diff)).toBeNull()
  })
})
