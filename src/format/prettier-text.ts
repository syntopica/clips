import { createRequire } from 'node:module'
import { join } from 'node:path'
import { format, resolveConfig } from 'prettier'

/** The repository's own prettier output for `text`, exactly as
 * `pnpm run check` demands it at the brain root.
 *
 * Config is resolved against the brain repository rather than against the file
 * being formatted: an ingest worktree lives under the temp dir with no
 * `node_modules`, so the `prettier.config.mjs` it carries as a tracked file
 * cannot import the shared formatting package. Plugin names need the same
 * anchor - prettier resolves them from the process cwd, which is `tools/clips`
 * when the CLI runs through `clips.sh` and anywhere at all when it does not.
 *
 * `relativePath` is repository-relative, and it decides both the parser and
 * which config overrides apply: `*.md` is the one that carries
 * `proseWrap: always`. */
export const prettierText = async (
  brainRepository: string,
  relativePath: string,
  text: string,
): Promise<string> => {
  const options = await resolveConfig(join(brainRepository, relativePath))
  const resolveFrom = createRequire(join(brainRepository, 'package.json'))
  const plugins = (options?.plugins ?? []).map((plugin) =>
    typeof plugin === 'string' ? resolveFrom.resolve(plugin) : plugin,
  )
  return format(text, { ...options, plugins, filepath: relativePath })
}
