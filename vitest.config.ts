import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    testTimeout: 30_000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/testing/**'],
      // Ratcheted at the measured floor on 2026-09-12 (76.64 / 68.38 / 78.96 /
      // 76.9 with src/testing excluded), the way the baseline conformance check seeds them: a run that
      // drops below fails, a run that climbs is the moment to raise these.
      thresholds: { statements: 76, branches: 68, functions: 78, lines: 76 },
    },
  },
})
