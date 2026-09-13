import { prettierText } from '../format/prettier-text.ts'
import { ledgerRelativePath } from '../ledger/ledger-relative-path.ts'
import type { Ledger } from '../ledger/ledger.ts'

/** The exact bytes of a ledger file. `JSON.stringify(_, null, 2)` alone is not
 * what the repository considers formatted - prettier collapses a short array
 * such as `pagesTouched` onto one line - so every ledger written before
 * 2026-08-02 failed the brain's own `pnpm run check`. */
export const ledgerFileText = async (
  brainRepository: string,
  ledger: Ledger,
): Promise<string> =>
  prettierText(
    brainRepository,
    ledgerRelativePath(ledger.clipId),
    `${JSON.stringify(ledger, null, 2)}\n`,
  )
