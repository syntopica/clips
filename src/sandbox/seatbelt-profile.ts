import { assertUsableRoot } from './assert-usable-root.ts'
import type { SeatbeltRoots } from './seatbelt-roots.ts'
import { seatbeltSubpaths } from './seatbelt-subpaths.ts'

/**
 * Builds a Seatbelt (SBPL) profile. Roots are interpolated into a quoted
 * s-expression, so a quote inside one would end the string and change the
 * policy - hence the hard rejection rather than escaping.
 */
export function seatbeltProfile(roots: SeatbeltRoots): string {
  for (const root of [
    ...roots.readable,
    ...roots.writable,
    ...roots.executable,
  ]) {
    assertUsableRoot(root)
  }

  return [
    '(version 1)',
    '(deny default)',
    '(allow process-fork)',
    '(allow signal (target self))',
    '(allow sysctl-read)',
    '(allow mach-lookup)',
    // Read on the root directory entry itself. Found empirically: with
    // `(deny default)` and only subpath grants, every process aborts with
    // SIGABRT and no message before the shell even starts, because no
    // `(subpath "/usr")`-style grant covers `/`. This is a literal, not a
    // subpath, so it opens the root entry and nothing beneath it.
    '(allow file-read* (literal "/"))',
    `(allow file-read* ${seatbeltSubpaths(roots.readable)})`,
    ...roots.writable.map((root) => `(allow file-write* (subpath "${root}"))`),
    ...roots.writable.map((root) => `(allow file-read* (subpath "${root}"))`),
    `(allow process-exec ${seatbeltSubpaths(roots.executable)})`,
    '(allow file-read* (literal "/dev/null") (literal "/dev/urandom") (literal "/dev/random"))',
    '(allow file-write* (literal "/dev/null"))',
    roots.allowNetwork ? '(allow network*)' : '(deny network*)',
    '',
  ].join('\n')
}
