import { currentSyntopicaConfig } from '../config/current-syntopica-config.ts'

/** Where this instance's capture archive actually is.
 *
 * `legacyArchive` wins while the archive is still its own repository beside the
 * data directory. The final shape puts it at `clips/` inside, and then only
 * `archive` is set. Reading `archive` alone was wrong in a way nothing caught:
 * on 2026-09-13 it pointed at the data root, so the metadata schema test found
 * no clips, skipped its 2001 generated cases and still reported success. */
export const clipsRepositoryPath = (): string => {
  const config = currentSyntopicaConfig()
  return config.legacyArchive ?? config.archive
}
