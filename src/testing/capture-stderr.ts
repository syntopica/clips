import { vi } from 'vitest'

/** Captures a command's stderr and restores the stream even when it throws. */
export const captureStderr = async (
  run: () => Promise<number>,
): Promise<{ exitCode: number; stderr: string }> => {
  const written: string[] = []
  const spy = vi.spyOn(process.stderr, 'write').mockImplementation(((
    chunk: string,
  ): boolean => {
    written.push(chunk)
    return true
  }) as typeof process.stderr.write)
  try {
    return { exitCode: await run(), stderr: written.join('') }
  } finally {
    spy.mockRestore()
  }
}
