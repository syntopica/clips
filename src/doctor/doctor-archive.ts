import { runSyntopicaGit } from '../config/run-syntopica-git.ts'
import type { DoctorCheck } from './doctor-check.ts'
import { doctorPublicRemote } from './doctor-public-remote.ts'

export function doctorArchive(archive: string): DoctorCheck {
  const raw = runSyntopicaGit(archive, [
    'config',
    '--includes',
    '--null',
    '--get-regexp',
    String.raw`^remote\..*\.(url|pushurl)$`,
  ])
  const remotes = runSyntopicaGit(archive, ['remote'])
  if ((raw.status !== 0 && raw.status !== 1) || remotes.status !== 0)
    return { passed: false, message: 'archive: cannot inspect remotes' }
  const urls = raw.stdout
    .split('\0')
    .filter((entry) => entry.includes('\n'))
    .map((entry) => entry.slice(entry.indexOf('\n') + 1))
  for (const remote of remotes.stdout.split('\n').filter(Boolean)) {
    for (const options of [['--all'], ['--push', '--all']]) {
      const effective = runSyntopicaGit(archive, [
        'remote',
        'get-url',
        ...options,
        '--',
        remote,
      ])
      if (effective.status !== 0)
        return { passed: false, message: 'archive: cannot resolve remotes' }
      urls.push(...effective.stdout.split('\n').filter(Boolean))
    }
  }
  const forbidden = urls.some(doctorPublicRemote)
  return {
    passed: !forbidden,
    message: forbidden
      ? 'archive: public engine remote refused'
      : 'archive: no public engine remote',
  }
}
