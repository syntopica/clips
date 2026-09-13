import { describe, expect, it } from 'vitest'
import { cursorGradeArgs } from './cursor-grade-args.ts'

describe('cursorGradeArgs', () => {
  const args = cursorGradeArgs('some-model')

  it('runs read-only, which is this transport spelling of plan mode', () => {
    expect(args).toContain('--mode')
    expect(args[args.indexOf('--mode') + 1]).toBe('ask')
  })

  it('grants no write or shell capability', () => {
    // The whole argument of the inline grader: it is handed untrusted captured
    // text, this repository holds live credentials, and a grader needs no tools
    // because everything it may consider is already in the prompt.
    expect(args).not.toContain('--force')
    expect(args).not.toContain('--yolo')
    expect(args).not.toContain('--approve-mcps')
  })

  it('trusts the workspace, or every page comes back ungraded', () => {
    // Without it cursor-agent refuses an unseen directory in under a second,
    // and an unattended run reports the refusal as a grading failure per page.
    expect(args).toContain('--trust')
  })

  it('asks for the json envelope unwrapCursorResponse expects', () => {
    expect(args[args.indexOf('--output-format') + 1]).toBe('json')
  })

  it('passes the model through', () => {
    expect(args[args.indexOf('--model') + 1]).toBe('some-model')
  })

  it('carries no prompt at all, because the prompt goes down a pipe', () => {
    // An argv prompt works on a small page and, at 480 KB, makes the process
    // exit 0 having written nothing whatsoever. `-p` is --print, and the token
    // after it must be another flag, never text.
    expect(args[args.indexOf('-p') + 1]).toBe('--trust')
    expect(args.every((arg) => arg.length < 64)).toBe(true)
  })
})
