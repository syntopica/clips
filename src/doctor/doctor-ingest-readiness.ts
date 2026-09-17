import type { SyntopicaConfig } from '../config/syntopica-config.ts'
import type { DoctorCheck } from './doctor-check.ts'
import { resolvesCommit } from './resolves-commit.ts'

/** What `clips ingest` needs beyond a valid configuration: a commit on `main`
 * and an `origin/main` in both the wiki and the clip archive, because the
 * pipeline ends in a fast-forward publication to a remote.
 *
 * A fresh instance has neither, and this is reported rather than failed: the
 * hub creates the repository without a commit or a remote, so an instance that
 * indexes, graphs, lints and captures perfectly well is not broken - it simply
 * has not been pointed at a destination yet. Before this line, a passing doctor
 * read as proof that ingestion was ready, and the first ingest died on `fatal:
 * ambiguous argument 'HEAD'`. */
export function doctorIngestReadiness(config: SyntopicaConfig): DoctorCheck {
  const missing = [
    { repository: config.dataRoot, name: 'wiki' },
    { repository: config.archive, name: 'archive' },
  ].flatMap(({ repository, name }) => [
    ...(resolvesCommit(repository, 'HEAD') ? [] : [`${name} has no commit`]),
    ...(resolvesCommit(repository, 'origin/main')
      ? []
      : [`${name} has no origin/main`]),
  ])
  return {
    passed: true,
    message:
      missing.length === 0
        ? 'ingest: ready to publish'
        : `ingest: publication not configured yet (${missing.join(', ')}); ` +
          'commit and set an origin before clips ingest, dry runs work without one',
  }
}
