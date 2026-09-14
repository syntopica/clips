import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { git } from './git.ts'

export const installCommitMessageHook = (
  repository: string,
  refuse = false,
): void => {
  const hooks = join(repository, '.git', 'test-hooks')
  mkdirSync(hooks, { recursive: true })
  writeFileSync(
    join(hooks, 'commit-msg'),
    `#!/bin/sh
${refuse ? '' : `head -n 1 "$1" | grep -Eq '^[a-z]+(\\([a-z-]+\\))?: .+[^.]$' && exit 0`}
echo 'subject may not be empty [subject-empty]'
echo 'type may not be empty [type-empty]' >&2
exit 1
`,
    { mode: 0o755 },
  )
  git(repository, 'config', 'core.hooksPath', hooks)
}
