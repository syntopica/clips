import { currentSyntopicaConfig } from '../config/current-syntopica-config.ts'

export function captureServiceOrigin(): string {
  const origin = currentSyntopicaConfig().captureOrigin
  if (origin === null)
    throw new Error('Configure capture.origin to enable the capture service')
  return origin
}
