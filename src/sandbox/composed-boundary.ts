import type { Boundary } from './boundary.ts'
import type { ComposedBoundaryOptions } from './composed-boundary-options.ts'

/**
 * Wraps a command in `sandbox-exec` with a profile file. This is the outer,
 * read-limiting layer only; when codex runs inside it, codex keeps its own
 * `-s workspace-write` sandbox, which is what continues to confine writes and
 * deny the network to model-issued commands.
 */
export function composedBoundary(options: ComposedBoundaryOptions): Boundary {
  return (command: string[]) => ({
    argv: ['/usr/bin/sandbox-exec', '-f', options.profilePath, ...command],
    env: options.env,
  })
}
