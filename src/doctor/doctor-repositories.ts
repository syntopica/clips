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
    return {
      name: 'repositories',
      passed: true,
      code: 'ok',
      message: 'repositories: valid Git identities',
    }
  } catch {
    return {
      name: 'repositories',
      passed: false,
      code: 'repositories_invalid',
      message: 'repositories: invalid Git identities or remotes',
    }
  }
}
