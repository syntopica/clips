import { describe, expect, it } from 'vitest'
import { runProbeCommand } from './run-probe-command.ts'

const PASSTHROUGH = (command: string[]) => ({ argv: command, env: {} })

describe('runProbeCommand', () => {
  it('captures a zero exit status and stdout', async () => {
    const result = await runProbeCommand(
      ['/bin/echo', 'hello'],
      PASSTHROUGH,
      5_000,
    )
    expect(result.exitCode).toBe(0)
    expect(result.stdout.trim()).toBe('hello')
    expect(result.timedOut).toBe(false)
  })

  it('captures a non-zero exit status and stderr', async () => {
    const result = await runProbeCommand(
      ['/bin/sh', '-c', 'echo boom >&2; exit 3'],
      PASSTHROUGH,
      5_000,
    )
    expect(result.exitCode).toBe(3)
    expect(result.stderr.trim()).toBe('boom')
  })

  it('reports a timeout instead of hanging', async () => {
    const result = await runProbeCommand(['/bin/sleep', '30'], PASSTHROUGH, 300)
    expect(result.timedOut).toBe(true)
    expect(result.exitCode).not.toBe(0)
  })

  it('reports a missing executable rather than throwing', async () => {
    const result = await runProbeCommand(
      ['/nonexistent/binary'],
      PASSTHROUGH,
      5_000,
    )
    expect(result.exitCode).not.toBe(0)
    expect(result.timedOut).toBe(false)
  })

  it('passes only the environment the boundary supplies', async () => {
    const boundary = (command: string[]) => ({
      argv: command,
      env: { MARKER: 'only-this' },
    })
    const result = await runProbeCommand(
      ['/bin/sh', '-c', 'echo "$MARKER:$HOME"'],
      boundary,
      5_000,
    )
    expect(result.stdout.trim()).toBe('only-this:')
  })

  it('applies the boundary wrapper to the argv', async () => {
    const boundary = (command: string[]) => ({
      argv: ['/usr/bin/env', 'WRAPPED=yes', ...command],
      env: {},
    })
    const result = await runProbeCommand(
      ['/bin/sh', '-c', 'echo $WRAPPED'],
      boundary,
      5_000,
    )
    expect(result.stdout.trim()).toBe('yes')
  })
})
