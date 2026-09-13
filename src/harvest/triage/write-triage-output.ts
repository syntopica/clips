import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildTopicFile } from './build-topic-file.ts'
import { buildTriageIndex } from './build-triage-index.ts'
import { readGoneUrls } from './read-gone-urls.ts'
import { triageOutputPath } from './triage-output-path.ts'
import type { TriageOutputRequest } from './triage-output-request.ts'
import { TRIAGE_TOPICS } from './triage-topic.ts'

/** Write a triage run to disk and return the directory it landed in.
 *
 * This is the step the deletion rule hangs off: mail is only moved to Trash
 * after this has returned, so a crash mid-run leaves the mail in place and
 * nothing is lost.
 * SPEC: docs/superpowers/specs/2026-07-29-newsletter-harvest-design.md */
export const writeTriageOutput = (request: TriageOutputRequest): string => {
  const directory = triageOutputPath(request.brainRepository, request.date)
  // Read before writing: a re-run replaces every topic file, and the
  // hand-applied `[gone-410]` markers only exist in the files being replaced.
  const goneUrls = readGoneUrls(directory)
  mkdirSync(directory, { recursive: true })
  for (const topic of TRIAGE_TOPICS) {
    const rows = request.articles.filter((article) => article.topic === topic)
    if (rows.length === 0) continue
    writeFileSync(
      join(directory, `${topic}.md`),
      buildTopicFile(topic, request.date, rows, goneUrls),
      'utf8',
    )
  }
  writeFileSync(
    join(directory, 'README.md'),
    buildTriageIndex(
      request.date,
      request.emailCount,
      request.linkCount,
      request.articles,
    ),
    'utf8',
  )
  return directory
}
