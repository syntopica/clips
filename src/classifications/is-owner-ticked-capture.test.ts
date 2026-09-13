import { describe, expect, it } from 'vitest'
import type { Clip } from '../clips/clip.ts'
import { isOwnerTickedCapture } from './is-owner-ticked-capture.ts'

const capturedFrom = (clippedFrom: string): Clip =>
  ({ metadata: { clipped_from: clippedFrom } }) as unknown as Clip

describe('isOwnerTickedCapture', () => {
  it('reads a harvested capture as the owner ticking it', () => {
    expect(isOwnerTickedCapture(capturedFrom('clips-harvest'))).toBe(true)
  })

  it('reads an extension capture as untick, since nobody chose it from a list', () => {
    expect(isOwnerTickedCapture(capturedFrom('mac-arm64-7735'))).toBe(false)
  })
})
