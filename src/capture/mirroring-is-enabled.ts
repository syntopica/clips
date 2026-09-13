/** Whether a clip's state may be published to the capture service.
 *
 * It exists because the test suite reached production. `ingest.integration.test`
 * runs a whole ingest against throwaway git repositories, `reconcileClip` now
 * mirrors at the end of that, and the shell that runs the tests exports
 * `CAPTURE_TOKEN` from `~/.config/secrets/agent-env.zsh` - so a green test run wrote a
 * `https://example.com/` row into the live inbox on 2026-08-04.
 *
 * Mocking the mirror in that one file would have fixed that one file. The guard
 * lives here instead, because the next end-to-end test to be written would have
 * reached production too, and nothing about its name would have said so.
 *
 * `CAPTURE_MIRROR=on` forces it back on, which is how the mirror's own tests
 * exercise the request path. */
export const mirroringIsEnabled = (): boolean => {
  const setting = process.env['CAPTURE_MIRROR']
  if (setting === 'off') return false
  if (setting === 'on') return true
  return process.env['VITEST'] === undefined
}
