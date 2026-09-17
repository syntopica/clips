import type { SyntopicaConfig } from '../config/syntopica-config.ts'
import type { DoctorCheck } from './doctor-check.ts'
import { doctorExecutableExists } from './doctor-executable-exists.ts'

export function doctorExecutables(
  config: SyntopicaConfig,
  environ: NodeJS.ProcessEnv,
): DoctorCheck {
  const commands = new Set(['git', 'uv', 'node', 'pnpm'])
  const adapters = new Map([
    ['codex', 'codex'],
    ['agy-fine', 'agy'],
    ['agy-bulk', 'agy'],
    ['cursor', 'cursor-agent'],
  ])
  for (const runner of Object.values(config.runners)) {
    const command = runner === null ? undefined : adapters.get(runner)
    if (command) commands.add(command)
  }
  if (config.browser !== null) commands.add(config.browser)
  // A count sends the reader into the source to find out which command is
  // gone; the names are what makes the line repairable.
  const missing = [...commands]
    .sort()
    .filter((command) => !doctorExecutableExists(command, environ))
  return {
    passed: missing.length === 0,
    message:
      missing.length === 0
        ? 'executables: all present'
        : `executables: ${String(missing.length)} missing (${missing.join(', ')})`,
  }
}
