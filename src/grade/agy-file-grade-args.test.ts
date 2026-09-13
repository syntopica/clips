import { describe, expect, it } from 'vitest'
import { agyFileGradeArgs } from './agy-file-grade-args.ts'
import { agyGradeArgs } from './agy-grade-args.ts'

describe('agyFileGradeArgs', () => {
  const args = agyFileGradeArgs('the prompt', 'model-x', '/tmp/schema.json', 20)

  it('carries the permission flag the file handoff needs', () => {
    expect(args).toContain('--dangerously-skip-permissions')
  })

  it('drops plan mode, which blocks the reads that are the point', () => {
    expect(args).not.toContain('plan')
    expect(args).not.toContain('--mode')
  })

  it('keeps the sandbox and slash-command restrictions', () => {
    expect(args).toContain('--sandbox')
    expect(args).toContain('--disable-slash-commands')
  })

  it('passes the schema and a unit-suffixed print timeout like the inline variant', () => {
    expect(args).toContain('/tmp/schema.json')
    expect(args).toContain('20m')
  })

  it('is the only variant with the permission flag - the inline one must stay safe', () => {
    expect(agyGradeArgs('p', 'm', '/tmp/s.json', 20)).not.toContain(
      '--dangerously-skip-permissions',
    )
  })
})
