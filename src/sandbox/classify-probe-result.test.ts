import { describe, expect, it } from 'vitest'
import { classifyProbeResult } from './classify-probe-result.ts'

const base = {
  exitCode: 0,
  signal: null,
  stdout: '',
  stderr: '',
  timedOut: false,
}

const SEATBELT =
  /operation not permitted|permission denied|\bEPERM\b|\bEACCES\b/i
const CONNECTION =
  /couldn't connect to server|connection refused|failed to connect/i

describe('classifyProbeResult', () => {
  it('treats a clean exit as succeeded', () => {
    expect(classifyProbeResult(base, SEATBELT)).toBe('succeeded')
  })

  it('recognises a seatbelt execvp denial', () => {
    expect(
      classifyProbeResult(
        {
          ...base,
          exitCode: 71,
          stderr:
            "sandbox-exec: execvp() of '/bin/zsh' failed: Operation not permitted",
        },
        SEATBELT,
      ),
    ).toBe('denied')
  })

  it('recognises a plain permission denial', () => {
    expect(
      classifyProbeResult(
        { ...base, exitCode: 1, stderr: 'cat: /x: Operation not permitted' },
        SEATBELT,
      ),
    ).toBe('denied')
  })

  it('treats a timeout as inconclusive, never as a denial', () => {
    expect(
      classifyProbeResult(
        { ...base, exitCode: null, signal: 'SIGKILL', timedOut: true },
        SEATBELT,
      ),
    ).toBe('inconclusive')
  })

  it('treats a non-zero exit with no denial signature as inconclusive', () => {
    expect(
      classifyProbeResult(
        { ...base, exitCode: 2, stderr: 'curl: (6) could not resolve host' },
        CONNECTION,
      ),
    ).toBe('inconclusive')
  })

  it('treats a bare abort as inconclusive', () => {
    expect(
      classifyProbeResult({ ...base, exitCode: 134, stderr: '' }, SEATBELT),
    ).toBe('inconclusive')
  })

  it('never denies a row whose assertion expects success', () => {
    expect(
      classifyProbeResult(
        { ...base, exitCode: 1, stderr: 'cat: /x: Operation not permitted' },
        null,
      ),
    ).toBe('inconclusive')
  })

  // The regression that motivated per-assertion signatures: curl failed reading
  // an SSL config file and wrote "Operation not permitted" while the network was
  // fully open. Under one shared signature list that read as a network denial.
  it('does not credit a filesystem refusal as a network denial', () => {
    const curlFailedOnAConfigFile = {
      ...base,
      exitCode: 77,
      stderr:
        'curl: (77) error setting certificate verify locations: Operation not permitted',
    }
    expect(classifyProbeResult(curlFailedOnAConfigFile, CONNECTION)).toBe(
      'inconclusive',
    )
    expect(classifyProbeResult(curlFailedOnAConfigFile, SEATBELT)).toBe(
      'denied',
    )
  })

  it('recognises curl failing to open a socket as a network denial', () => {
    expect(
      classifyProbeResult(
        {
          ...base,
          exitCode: 7,
          stderr:
            "curl: (7) Failed to connect to 1.1.1.1 port 80 after 1 ms: Couldn't connect to server",
        },
        CONNECTION,
      ),
    ).toBe('denied')
  })
})
