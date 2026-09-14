import { describe, expect, it } from 'vitest'
import { instanceCommitMessage } from './instance-commit-message.ts'
import type { InstanceCommit } from './instance-commit.ts'

describe('instanceCommitMessage', () => {
  const clipId = '01ARZ3NDEKTSV4RRFFQ69G5FAV'
  const cases = {
    route: { kind: 'route', clipId, code: 'CONTENT_VALIDATION_FAILED' },
    publish: { kind: 'publish', clipId },
    requeue: { kind: 'requeue', clipId },
    process: { kind: 'process', clipId },
    'process-cited': { kind: 'process-cited', clipIds: [clipId] },
    'reconcile-cited': { kind: 'reconcile-cited', clipIds: [clipId] },
    reject: { kind: 'reject', clipId, count: 2 },
    harvest: { kind: 'harvest' },
    'export-chatgpt': { kind: 'export-chatgpt', count: 12 },
  } satisfies Record<InstanceCommit['kind'], InstanceCommit>

  it.each(Object.values(cases))(
    'builds a conventional $kind message',
    (input) => {
      const message = instanceCommitMessage(input)
      const subject = message.split('\n')[0] ?? ''
      expect(subject).toMatch(/^[a-z]+(?:\([a-z-]+\))?: \S.*$/)
      expect(subject).toMatch(
        /: (?:route|ingest|requeue|mark|reconcile|record|add|export) /,
      )
      expect(subject).not.toMatch(/\.$/)
      expect(subject.length).toBeLessThanOrEqual(100)
    },
  )

  it.each(
    Object.values(cases).filter(
      (input) => 'clipId' in input || 'clipIds' in input,
    ),
  )('preserves clip identifiers for $kind', (input) => {
    expect(instanceCommitMessage(input)).toContain(clipId)
  })

  it('retains failure codes in the body and uses the tree-specific scope', () => {
    expect(instanceCommitMessage(cases.route)).toBe(
      `chore(clips): route clip ${clipId} to needs-claude\n\nFailure: CONTENT_VALIDATION_FAILED`,
    )
    expect(instanceCommitMessage(cases.publish)).toBe(
      `docs(brain): ingest clip ${clipId}`,
    )
    expect(instanceCommitMessage(cases.harvest)).toBe(
      'chore(clips): add pending clips from harvest',
    )
    expect(instanceCommitMessage(cases['reconcile-cited'])).toMatch(
      /^chore\(brain\):/,
    )
    expect(instanceCommitMessage(cases['export-chatgpt'])).toMatch(
      /^docs\(chatgpt\):/,
    )
  })
})
