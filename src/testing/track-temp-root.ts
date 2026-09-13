import { rmSync } from 'node:fs'
import { afterAll } from 'vitest'

/** Registers a temp directory for removal once this test file finishes. */
export const trackTempRoot: (root: string) => void = (() => {
  const roots: string[] = []
  afterAll(() => {
    for (const root of roots) rmSync(root, { recursive: true, force: true })
  })
  return (root: string) => {
    roots.push(root)
  }
})()
