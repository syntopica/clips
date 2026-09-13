import { afterEach, describe, expect, it, vi } from 'vitest'

import { BRAIN_REPOSITORY_PATH } from '../clips/brain-repository-path.ts'
import { clipsRepositoryPath } from '../clips/clips-repository-path.ts'
import { findDataDirectory } from '../config/find-data-directory.ts'
import { loadSyntopicaConfig } from '../config/load-syntopica-config.ts'
import { doctorReport } from '../doctor/doctor-report.ts'
import { runIngestCommand } from './run-ingest-command.ts'
import { runReadOnlyCommand } from './run-read-only-command.ts'
import { runSelectedCli } from './run-selected-cli.ts'
import { runUnlockedWriteCommand } from './run-unlocked-write-command.ts'

vi.mock('../clips/brain-repository-path.ts', () => ({
  BRAIN_REPOSITORY_PATH: '/fixture',
}))
vi.mock('../clips/clips-repository-path.ts', () => ({
  clipsRepositoryPath: () => '/legacy/archive',
}))

const configRoots = vi.hoisted(() => ({
  dataRoot: '/fixture',
  archive: '/fixture/archive',
  brainPath: '/engine-brain',
  clipsPath: '/engine-clips',
  legacyArchive: '/legacy/archive',
}))

const repositories = vi.hoisted(() => ({
  brain: '/fixture',
  clips: '/fixture/archive',
}))

vi.mock('../config/find-data-directory.ts', () => ({
  findDataDirectory: vi.fn(() => repositories.brain),
}))
vi.mock('../config/load-syntopica-config.ts', () => ({
  loadSyntopicaConfig: vi.fn(() => configRoots),
}))
vi.mock('../doctor/doctor-report.ts', () => ({ doctorReport: vi.fn(() => 0) }))
vi.mock('./run-read-only-command.ts', () => ({
  runReadOnlyCommand: vi
    .fn<typeof runReadOnlyCommand>()
    .mockResolvedValue(null),
}))
vi.mock('./run-unlocked-write-command.ts', () => ({
  runUnlockedWriteCommand: vi
    .fn<typeof runUnlockedWriteCommand>()
    .mockResolvedValue(null),
}))
vi.mock('./run-ingest-command.ts', () => ({
  runIngestCommand: vi.fn<typeof runIngestCommand>().mockResolvedValue(0),
}))

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
  Object.assign(configRoots, {
    dataRoot: '/fixture',
    archive: '/fixture/archive',
    brainPath: '/engine-brain',
    clipsPath: '/engine-clips',
  })
})

describe('runSelectedCli', () => {
  it('passes the selected repositories to every dispatch stage', async () => {
    await expect(
      runSelectedCli(['--data', '/selected', 'ingest', '--dry-run']),
    ).resolves.toBe(0)
    expect(findDataDirectory).toHaveBeenCalledWith(
      '/selected',
      process.env,
      process.cwd(),
    )
    expect(loadSyntopicaConfig).toHaveBeenCalledWith(
      repositories.brain,
      process.env,
    )
    expect(runIngestCommand).toHaveBeenCalledWith(
      expect.objectContaining({ command: 'ingest', dryRun: true }),
      { brain: repositories.brain, clips: repositories.clips },
    )
    expect(runReadOnlyCommand).toHaveBeenCalledWith(expect.anything(), {
      brain: repositories.brain,
      clips: repositories.clips,
    })
    expect(runUnlockedWriteCommand).toHaveBeenCalledWith(expect.anything(), {
      brain: repositories.brain,
      clips: repositories.clips,
    })
  })
  it('returns a handled read-only command result', async () => {
    vi.mocked(runReadOnlyCommand).mockResolvedValueOnce(2)
    await expect(runSelectedCli(['status'])).resolves.toBe(2)
    expect(runUnlockedWriteCommand).not.toHaveBeenCalled()
  })
  it('returns a handled write command result', async () => {
    vi.mocked(runUnlockedWriteCommand).mockResolvedValueOnce(1)
    await expect(runSelectedCli(['audit'])).resolves.toBe(1)
    expect(runIngestCommand).not.toHaveBeenCalled()
  })
  it('routes doctor without loading configuration twice', async () => {
    await expect(
      runSelectedCli(['--data', '/selected', 'doctor']),
    ).resolves.toBe(0)
    expect(doctorReport).toHaveBeenCalledWith(repositories.brain, process.env)
    expect(loadSyntopicaConfig).not.toHaveBeenCalled()
  })
  it('rejects doctor options', async () => {
    await expect(runSelectedCli(['doctor', '--write'])).rejects.toThrow(
      'doctor does not accept',
    )
    expect(doctorReport).not.toHaveBeenCalled()
  })
  it('prints help without requiring a configured instance', async () => {
    const output = vi.spyOn(process.stdout, 'write').mockReturnValue(true)
    await expect(runSelectedCli(['--help'])).resolves.toBe(0)
    expect(findDataDirectory).not.toHaveBeenCalled()
    expect(output).toHaveBeenCalledWith(expect.stringContaining('clips doctor'))
    output.mockRestore()
  })
})

it('preserves legacy repositories for implicit monorepo gate configuration', async () => {
  vi.stubEnv('SYNTOPICA_DATA', undefined)
  Object.assign(configRoots, {
    archive: '/fixture',
    brainPath: '/fixture',
    clipsPath: '/fixture',
  })
  await expect(runSelectedCli(['ingest', '--dry-run'])).resolves.toBe(0)
  expect(runIngestCommand).toHaveBeenCalledWith(expect.anything(), {
    brain: BRAIN_REPOSITORY_PATH,
    clips: clipsRepositoryPath(),
  })
})

it.each([
  { argv: ['--data', '/selected', 'status'], dataEnvironment: undefined },
  { argv: ['status'], dataEnvironment: '/selected' },
])(
  'preserves deliberate monorepo selection through dispatch: %j',
  async ({ argv, dataEnvironment }) => {
    vi.stubEnv('SYNTOPICA_DATA', dataEnvironment)
    Object.assign(configRoots, {
      archive: '/fixture',
      brainPath: '/fixture',
      clipsPath: '/fixture',
    })
    await expect(runSelectedCli(argv)).resolves.toBe(0)
    expect(runReadOnlyCommand).toHaveBeenCalledWith(expect.anything(), {
      brain: '/fixture',
      clips: '/fixture',
    })
  },
)

it('dispatches the loader-resolved root rather than the discovery spelling', async () => {
  Object.assign(configRoots, {
    dataRoot: '/resolved-data',
    archive: '/resolved-data/archive',
  })
  await expect(runSelectedCli(['--data', '/selected', 'status'])).resolves.toBe(
    0,
  )
  expect(runReadOnlyCommand).toHaveBeenCalledWith(expect.anything(), {
    brain: '/resolved-data',
    clips: '/resolved-data/archive',
  })
})

it('keeps a different implicitly discovered monorepo away from legacy repositories', async () => {
  vi.stubEnv('SYNTOPICA_DATA', undefined)
  Object.assign(configRoots, {
    dataRoot: '/other',
    archive: '/other',
    brainPath: '/other',
    clipsPath: '/other',
  })
  await expect(runSelectedCli(['status'])).resolves.toBe(0)
  expect(runReadOnlyCommand).toHaveBeenCalledWith(expect.anything(), {
    brain: '/other',
    clips: '/other',
  })
})
