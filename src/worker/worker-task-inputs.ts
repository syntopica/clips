import { isAbsolute, relative } from 'node:path'
import { WORKER_MAX_TASK_INPUTS } from './worker-max-task-inputs.ts'

/** Absolute paths as a task manifest relative to the instance root, or the
 * reason they cannot be one.
 *
 * The worker copies each manifest entry out of the profile's `input_root`,
 * which for this engine is the instance root, so a file outside it is refused
 * here with its name rather than failing later as a bare `input_missing`. */
export const workerTaskInputs = (
  dataRoot: string,
  paths: readonly string[],
): string[] | string => {
  if (paths.length > WORKER_MAX_TASK_INPUTS)
    return `${String(paths.length)} files exceed the worker's ${String(WORKER_MAX_TASK_INPUTS)}-file task manifest`
  const inputs: string[] = []
  for (const path of paths) {
    const inside = relative(dataRoot, path)
    if (inside === '' || inside.startsWith('..') || isAbsolute(inside))
      return `${path} is outside the instance, where the worker cannot read it`
    inputs.push(inside)
  }
  return inputs
}
