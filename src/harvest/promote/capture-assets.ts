import { join } from 'node:path'
import { runCommand } from '../run-command.ts'

/** Fetch every remote asset a freshly written clip references, so the capture
 * does not depend on someone else's CDN staying up.
 *
 * Delegates to `tools/capture/backfill_assets.py` rather than reimplementing the
 * fetch here. That script is the tested one - it found two real bugs against
 * live data (HTML-escaped URLs in attributes, and failures needing a nullable
 * hash column) - and duplicating its logic in TypeScript would mean two places
 * to keep correct for no gain, since this is transport work against untrusted
 * hosts. Same reasoning as `medium_transport.py`.
 *
 * Asset capture never fails a promotion. A clip whose text was captured is
 * worth keeping even if every image 404s; the script records per-asset status in
 * `assets.json` and the url index, so a partial capture is visible rather than
 * silent. Throwing here would discard a good clip over a dead thumbnail.
 * SPEC: docs/superpowers/specs/2026-07-30-capture-first-pipeline-design.md */
export const captureAssets = async (
  brainRepository: string,
  clipDirectory: string,
): Promise<void> => {
  const script = join(brainRepository, 'tools', 'capture', 'backfill_assets.py')
  try {
    await runCommand('python3', [script, clipDirectory])
  } catch {
    // Recorded by the script itself; a promotion is not worth losing over it.
  }
}
