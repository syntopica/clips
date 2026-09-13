import type { ProbeAssertion } from './probe-assertion.ts'
import { REFUSED_BY_SEATBELT } from './refused-by-seatbelt.ts'
import { REFUSED_CONNECTION } from './refused-connection.ts'

/**
 * The rows are ordered deliberately: every `succeeded` row comes before every
 * `denied` row, because a denial only carries information once the shell has
 * been shown to start and the worktree to be usable.
 */
export const PROBE_ASSERTIONS: readonly ProbeAssertion[] = [
  {
    id: 'shell-starts',
    description: 'a shell runs inside the boundary at all',
    expected: 'succeeded',
    command: () => ['/bin/sh', '-c', 'exit 0'],
    denialSignature: null,
  },
  {
    id: 'worktree-read',
    description: 'the worktree is readable',
    expected: 'succeeded',
    command: (paths) => ['/bin/cat', `${paths.worktree}/SCHEMA.md`],
    denialSignature: null,
  },
  {
    id: 'worktree-write',
    description: 'the worktree is writable',
    expected: 'succeeded',
    command: (paths) => ['/usr/bin/touch', `${paths.worktree}/probe-write`],
    denialSignature: null,
  },
  {
    id: 'clip-read',
    description: 'the selected clip is readable',
    expected: 'succeeded',
    command: (paths) => ['/bin/cat', `${paths.clipInput}/index.md`],
    denialSignature: null,
  },
  {
    id: 'outside-read-denied',
    description: 'a canary outside the allowed roots is unreadable',
    expected: 'denied',
    command: (paths) => ['/bin/cat', paths.canaryFile],
    denialSignature: REFUSED_BY_SEATBELT,
  },
  {
    id: 'ssh-read-denied',
    description: 'the ssh directory is unreadable',
    expected: 'denied',
    command: (paths) => ['/bin/ls', `${paths.homeDirectory}/.ssh`],
    denialSignature: REFUSED_BY_SEATBELT,
  },
  {
    id: 'codex-home-read-denied',
    description: 'the real codex home is unreadable',
    expected: 'denied',
    command: (paths) => ['/bin/cat', `${paths.codexHome}/auth.json`],
    denialSignature: REFUSED_BY_SEATBELT,
  },
  {
    id: 'outside-write-denied',
    description: 'writing outside the worktree fails',
    expected: 'denied',
    command: (paths) => ['/usr/bin/touch', paths.outsideWritePath],
    denialSignature: REFUSED_BY_SEATBELT,
  },
  {
    id: 'network-denied',
    description: 'a network request from inside the boundary fails',
    expected: 'denied',
    // -sS, never bare -s: plain -s silences curl's own error text as well as
    // the progress meter, so a genuine refusal writes nothing to stderr and
    // classifies as inconclusive - or worse, some other component's
    // "Operation not permitted" gets read as the network denial.
    command: () => [
      '/usr/bin/curl',
      '-sS',
      '-m',
      '5',
      '-o',
      '/dev/null',
      'http://1.1.1.1',
    ],
    denialSignature: REFUSED_CONNECTION,
  },
]
