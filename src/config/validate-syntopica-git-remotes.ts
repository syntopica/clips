import { InvalidSyntopicaConfigError } from './invalid-syntopica-config-error.ts'
import { runSyntopicaGit } from './run-syntopica-git.ts'
import { validateSyntopicaUrls } from './validate-syntopica-urls.ts'

export function validateSyntopicaGitRemotes(root: string): void {
  const raw = runSyntopicaGit(root, [
    'config',
    '--local',
    '--includes',
    '--null',
    '--get-regexp',
    String.raw`^remote\..*\.(url|pushurl)$`,
  ])
  if (raw.status !== 0 && raw.status !== 1)
    throw new InvalidSyntopicaConfigError(
      'Cannot inspect configured Git remotes',
    )
  for (const entry of raw.stdout.split('\0')) {
    const separator = entry.indexOf('\n')
    if (separator !== -1) validateSyntopicaUrls(entry.slice(separator + 1))
  }
  const remotes = runSyntopicaGit(root, ['remote'])
  if (remotes.status !== 0)
    throw new InvalidSyntopicaConfigError(
      'Cannot enumerate configured Git remotes',
    )
  for (const remote of remotes.stdout.trim().split('\n').filter(Boolean)) {
    for (const options of [['--all'], ['--push', '--all']]) {
      const effective = runSyntopicaGit(root, [
        'remote',
        'get-url',
        ...options,
        '--',
        remote,
      ])
      if (effective.status !== 0)
        throw new InvalidSyntopicaConfigError(
          'Cannot resolve configured Git remote',
        )
      for (const url of effective.stdout.trim().split('\n'))
        validateSyntopicaUrls(url)
    }
  }
}
