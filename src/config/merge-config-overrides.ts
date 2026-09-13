import { overrideCaptureMirror } from './override-capture-mirror.ts'
import { overrideCaptureOrigin } from './override-capture-origin.ts'
import { overrideGradeRunner } from './override-grade-runner.ts'
import { overrideHeadlessBrowser } from './override-headless-browser.ts'
import { overrideSynthesisRunner } from './override-synthesis-runner.ts'
import { overrideTriageRefiner } from './override-triage-refiner.ts'
import { overrideTriageRunner } from './override-triage-runner.ts'

export function mergeConfigOverrides(
  document: Record<string, unknown>,
  environ: NodeJS.ProcessEnv,
): Record<string, unknown> {
  let result = document
  result = overrideCaptureMirror(result, environ)
  result = overrideCaptureOrigin(result, environ)
  result = overrideGradeRunner(result, environ)
  result = overrideSynthesisRunner(result, environ)
  result = overrideTriageRunner(result, environ)
  result = overrideTriageRefiner(result, environ)
  result = overrideHeadlessBrowser(result, environ)
  return result
}
