/**
 * A well-formed CODEX_ENABLED boundary decision, used as the base fixture
 * for read-boundary-decision tests. Individual tests spread this object and
 * override the fields they mean to break.
 */
export const enabledBoundaryDecisionFixture = {
  schemaVersion: 1,
  decision: 'CODEX_ENABLED',
  decidedAt: '2026-07-27T18:00:00Z',
  mechanism: 'composed-sandbox-exec-workspace-write',
  reproducibleCommand:
    'pnpm --dir tools/clips test tests/sandbox/codex-in-boundary.integration.test.ts',
  mechanismsEvaluated: ['codex-permissions-profile', 'composed-sandbox-exec'],
  rows: [
    {
      id: 'shell-starts',
      expected: 'succeeded',
      actual: 'succeeded',
      exitCode: 0,
      signal: null,
      stderrExcerpt: '',
    },
    {
      id: 'worktree-read',
      expected: 'succeeded',
      actual: 'succeeded',
      exitCode: 0,
      signal: null,
      stderrExcerpt: '',
    },
    {
      id: 'worktree-write',
      expected: 'succeeded',
      actual: 'succeeded',
      exitCode: 0,
      signal: null,
      stderrExcerpt: '',
    },
    {
      id: 'clip-read',
      expected: 'succeeded',
      actual: 'succeeded',
      exitCode: 0,
      signal: null,
      stderrExcerpt: '',
    },
    {
      id: 'outside-read-denied',
      expected: 'denied',
      actual: 'denied',
      exitCode: 1,
      signal: null,
      stderrExcerpt: '',
    },
    {
      id: 'ssh-read-denied',
      expected: 'denied',
      actual: 'denied',
      exitCode: 1,
      signal: null,
      stderrExcerpt: '',
    },
    {
      id: 'codex-home-read-denied',
      expected: 'denied',
      actual: 'denied',
      exitCode: 1,
      signal: null,
      stderrExcerpt: '',
    },
    {
      id: 'outside-write-denied',
      expected: 'denied',
      actual: 'denied',
      exitCode: 1,
      signal: null,
      stderrExcerpt: '',
    },
    {
      id: 'network-denied',
      expected: 'denied',
      actual: 'denied',
      exitCode: 1,
      signal: null,
      stderrExcerpt: '',
    },
  ],
  justification: 'every probe row matched',
}
