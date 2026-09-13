import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runCommand } from '../harvest/run-command.ts'
import { completeDump } from './complete-dump.ts'
import { headlessBrowserPath } from './headless-browser-path.ts'

/** The DOM of one page after its scripts have run, through a headless browser.
 *
 * `--dump-dom` prints the document once the virtual clock is spent, which is
 * the whole capability: a single-page application ships a shell whose article
 * is a second request, and the raw transport can only ever see the shell.
 *
 * A fresh `--user-data-dir` every time, never the owner's profile. Chrome
 * refuses to be driven while the default profile is open, and pointing a
 * scripted run at it would also mean fetching the page with the owner's
 * logged-in cookies - a different thing to capture than the URL they shared.
 *
 * **The timeout is a normal outcome on full Chrome, not only a failure.**
 * Measured 2026-08-05 on Chrome 150.0.7871.189: it writes the whole document
 * and then never exits, on `example.com` as readily as on a heavy page, and no
 * combination of `--headless=old`, `--single-process` or `--disable-breakpad`
 * changes that. `chrome-headless-shell` does exit, in about a second, with
 * byte-identical output - so pointing `CLIPS_HEADLESS_BROWSER` at one turns a
 * 30-second wait into a 1-second one. Where only the full browser is installed,
 * a dump that reached `</html>` before the kill is the page, and treating it as
 * a failure would throw away the render this whole path exists to get.
 * SPEC: docs/superpowers/specs/2026-08-04-general-extraction-design.md */
export const renderPage = async (url: string): Promise<string> => {
  if (!url.toLowerCase().startsWith('https://'))
    throw new Error(`refusing a non-https url: ${url}`)

  const browser = headlessBrowserPath()
  if (browser === null)
    throw new Error(
      'no headless browser installed - set CLIPS_HEADLESS_BROWSER to one',
    )

  const profile = await mkdtemp(join(tmpdir(), 'clips-headless-'))
  try {
    const { stdout } = await runCommand(
      browser,
      [
        '--headless',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        `--user-data-dir=${profile}`,
        '--virtual-time-budget=8000',
        '--dump-dom',
        url,
      ],
      {
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
        timeout: 30_000,
        killSignal: 'SIGKILL',
      },
    )
    return stdout
  } catch (error) {
    const dumped = completeDump(error)
    if (dumped === null) throw error
    return dumped
  } finally {
    await rm(profile, { recursive: true, force: true })
  }
}
