import type { DigestLink } from './digest-link.ts'

export type DatedDigestLink = DigestLink & { date: string; sender: string }
