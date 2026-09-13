/** One-off migration: rewrite the `brainCommit` recorded in every processed
 * clip's `state.json` through a `git filter-repo` commit map.
 *
 * Why this exists. `clips status` resolves the sha a clip records against the
 * brain repository, and on 2026-09-02 a `git filter-repo` run rewrote the
 * brain's history: every commit got a new sha, so all 1,191 processed clips
 * started reporting `brainCommit <sha> does not resolve`. Nothing was lost -
 * `.git/filter-repo/commit-map` maps every old sha to the rewritten one, and
 * each of those is reachable from `main` - so this is bookkeeping to redo, not
 * data to recover.
 *
 * It is a script rather than a `clips` subcommand on purpose: its input is a
 * machine-local, single-use artifact that normally does not exist.
 *
 * Usage, from the repository root:
 *   node tools/clips/scripts/remap-brain-commits.ts --dry-run [--limit N]
 *   node tools/clips/scripts/remap-brain-commits.ts [--limit N]
 *
 * Refuses to write unless the new sha resolves to a commit in the brain, so a
 * map entry pointing at a dropped commit (40 zeros) or at an object this clone
 * does not have stops that clip instead of corrupting its record.
 */
import { execFile } from 'node:child_process'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

const run = promisify(execFile)

const BRAIN = join(homedir(), 'p', 'brain')
const CLIPS = join(homedir(), 'p', 'brain-clips')
const PROCESSED = join(CLIPS, 'clips', 'processed')
const COMMIT_MAP = join(BRAIN, '.git', 'filter-repo', 'commit-map')

const dryRun = process.argv.includes('--dry-run')
const limitFlag = process.argv.indexOf('--limit')
const limit =
  limitFlag === -1
    ? Number.POSITIVE_INFINITY
    : Number(process.argv[limitFlag + 1])

const readCommitMap = async (): Promise<Map<string, string>> => {
  const text = await readFile(COMMIT_MAP, 'utf8')
  const map = new Map<string, string>()
  for (const line of text.split('\n').slice(1)) {
    const [old, next] = line.trim().split(/\s+/)
    if (old && next && old.length === 40 && next.length === 40)
      map.set(old, next)
  }
  return map
}

const stateFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true })
  const found: string[] = []
  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) found.push(...(await stateFiles(path)))
    else if (entry.name === 'state.json') found.push(path)
  }
  return found.sort()
}

const resolves = async (sha: string): Promise<boolean> => {
  try {
    await run('git', ['-C', BRAIN, 'cat-file', '-e', `${sha}^{commit}`])
    return true
  } catch {
    return false
  }
}

const map = await readCommitMap()
const files = await stateFiles(PROCESSED)
let remapped = 0
let alreadyLive = 0
let unmapped = 0
let unresolvable = 0

for (const file of files) {
  if (remapped >= limit) break
  const raw = await readFile(file, 'utf8')
  const state = JSON.parse(raw) as { brainCommit: string | null }
  const current = state.brainCommit
  if (current === null) continue
  if (await resolves(current)) {
    alreadyLive += 1
    continue
  }
  const next = map.get(current)
  if (next === undefined) {
    unmapped += 1
    process.stdout.write(`unmapped  ${current}  ${file}\n`)
    continue
  }
  if (!(await resolves(next))) {
    unresolvable += 1
    process.stdout.write(`unresolvable  ${current} -> ${next}  ${file}\n`)
    continue
  }
  remapped += 1
  process.stdout.write(
    `${dryRun ? 'would remap' : 'remap'}  ${current} -> ${next}  ${file}\n`,
  )
  if (!dryRun) await writeFile(file, raw.replace(current, next))
}

process.stdout.write(
  `\n${String(files.length)} processed clip(s): ${String(remapped)} ${dryRun ? 'to remap' : 'remapped'}, ` +
    `${String(alreadyLive)} already resolving, ${String(unmapped)} unmapped, ${String(unresolvable)} unresolvable\n`,
)
