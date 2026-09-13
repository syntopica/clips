import type { CandidateRootsInput } from './candidate-roots-input.ts'
import type { SeatbeltRoots } from './seatbelt-roots.ts'

/**
 * The roots under experiment, isolated in their own file on purpose.
 *
 * The probe's assertions are fixed; these roots are the only variable. This
 * file isolates the plain-command probe's roots as a single variable, so a
 * change to the boundary being tested is visible without touching the probe
 * itself. The ten mechanisms tried against codex were evaluated by editing
 * roots and profiles inline elsewhere, not by revising this file in place;
 * `git log -p` on this file is not a record of that history.
 *
 * A root is never added here to make a denial assertion pass. Widening until
 * `outside-read-denied` goes green would defeat the probe entirely.
 */
export function candidateRoots(input: CandidateRootsInput): SeatbeltRoots {
  return {
    readable: [
      '/usr',
      '/bin',
      '/sbin',
      '/System',
      '/private/var/select',
      // /private/etc, not /etc: /etc is a symlink into /private and Seatbelt
      // matches the canonical path, so an `/etc` grant is inert. It was, and
      // curl then failed reading /private/etc/ssl/openssl.cnf rather than on
      // the network - which the classifier read as a network denial.
      '/private/etc',
      input.clipInput,
    ],
    writable: [input.worktree, input.sandboxTmp],
    executable: ['/usr/bin', '/bin', '/usr/sbin', '/sbin'],
    allowNetwork: false,
  }
}
