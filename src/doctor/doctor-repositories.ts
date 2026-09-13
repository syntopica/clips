import type { SyntopicaConfig } from '../config/syntopica-config.ts'
import { validateSyntopicaGitRoots } from '../config/validate-syntopica-git-roots.ts'
import type { DoctorCheck } from './doctor-check.ts'

export function doctorRepositories(config: SyntopicaConfig): DoctorCheck {
  try {
    validateSyntopicaGitRoots([
      config.dataRoot,
      config.archive,
      config.brainPath,
      config.clipsPath,
    ])
    return { passed: true, message: 'repositories: valid Git identities' }
  } catch {
    return {
      passed: false,
      message: 'repositories: invalid Git identities or remotes',
    }
  }
}
