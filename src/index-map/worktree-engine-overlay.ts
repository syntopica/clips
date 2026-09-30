import { currentSyntopicaConfig } from '../config/current-syntopica-config.ts'
import { isSyntopicaObject } from '../config/is-syntopica-object.ts'
import { readSyntopicaLayers } from '../config/read-syntopica-layers.ts'
import { resolveSyntopicaFieldPath } from '../config/resolve-syntopica-field-path.ts'
import { syntopicaValueAt } from '../config/syntopica-value-at.ts'

/** A `syntopica.local.json` body pinning every declared engine to the absolute
 * path the instance resolves it to.
 *
 * An instance names its engines relative to the data directory - `../brain` -
 * and an ingest worktree lives in a temporary directory, where that path names
 * nothing. The builder loads the worktree's own configuration, so without the
 * pin it refuses with "Each configured repository must be a Git worktree
 * root" (measured 2026-09-30 in the worktree of clip 01M3QXGJ). */
export const worktreeEngineOverlay = (): Record<string, unknown> => {
  const root = currentSyntopicaConfig().dataRoot
  const { document, origins } = readSyntopicaLayers(root)
  const declared = syntopicaValueAt(document, 'engines')
  const engines: Record<string, { path: string }> = {}
  if (isSyntopicaObject(declared))
    for (const name of Object.keys(declared))
      engines[name] = {
        path: resolveSyntopicaFieldPath(
          document,
          origins,
          root,
          `engines.${name}.path`,
        ),
      }
  return { engines }
}
