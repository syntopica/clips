import { EXIT_CODE } from '../cli/exit-code.ts'
import { currentBranch } from '../git/current-branch.ts'
import { fastForward } from '../git/fast-forward.ts'
import { fetchOrigin } from '../git/fetch-origin.ts'
import { isWorkingTreeClean } from '../git/is-working-tree-clean.ts'

/** The working tree is checked before the merge, not after it fails. Verified:
 * with one uncommitted edit, `git merge --ff-only origin/main` exits 1 with
 * "Your local changes would be overwritten", which fastForward can only report
 * as a rewritten history - sending the operator to look for a force-push that
 * never happened. The two failures need separate messages because they need
 * separate fixes: stash or commit, versus investigate the remote. */
export const updateClone = async (clipsRepository: string): Promise<number> => {
  const branch = await currentBranch(clipsRepository)
  if (branch !== 'main') {
    process.stderr.write(`${clipsRepository} is on ${branch}, expected main\n`)
    return EXIT_CODE.fatalLocal
  }
  if (!(await isWorkingTreeClean(clipsRepository))) {
    process.stderr.write(
      `${clipsRepository} has uncommitted changes; commit or stash them before pulling\n`,
    )
    return EXIT_CODE.fatalLocal
  }
  await fetchOrigin(clipsRepository)
  await fastForward(clipsRepository, 'origin/main')
  process.stdout.write(`${clipsRepository} is up to date with origin/main\n`)
  return EXIT_CODE.success
}
