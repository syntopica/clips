import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

export const cloneRepository = async (
  url: string,
  destination: string,
): Promise<void> => {
  const execFileAsync = promisify(execFile)
  await execFileAsync('git', ['clone', url, destination], {
    encoding: 'utf8',
    env: { ...process.env, LC_ALL: 'C' },
  })
}
