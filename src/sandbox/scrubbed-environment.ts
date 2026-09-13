import type { SandboxDirectories } from './sandbox-directories.ts'

/**
 * The environment is built from nothing rather than filtered from the caller's.
 * A denylist of credential variable names is a losing game; an allowlist of
 * three paths is not.
 */
export function scrubbedEnvironment(
  paths: SandboxDirectories,
): Record<string, string> {
  return {
    HOME: paths.sandboxHome,
    TMPDIR: paths.tmpDir,
    XDG_CONFIG_HOME: paths.sandboxHome,
    CODEX_HOME: paths.codexHome,
    PATH: '/usr/bin:/bin:/usr/sbin:/sbin',
    LC_ALL: 'C',
  }
}
