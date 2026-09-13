import { describe, expect, it } from 'vitest'
import { EXIT_CODE } from './exit-code.ts'
import { runCli } from './run-cli.ts'

describe('runCli', () => {
  it('resolves to EXIT_CODE.fatalLocal for a parse error instead of throwing', async () => {
    await expect(runCli(['refresh'])).resolves.toBe(EXIT_CODE.fatalLocal)
  })
})
