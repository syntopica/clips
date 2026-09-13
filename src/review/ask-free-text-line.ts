import { createInterface } from 'node:readline/promises'

/** One prompted line, kept as typed. `askLine` lowercases because it reads
 * single-letter menu answers; a rejection reason is prose that goes back to a
 * model, so its case and wording survive. Trimmed only. */
export const askFreeTextLine = async (prompt: string): Promise<string> => {
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  try {
    return (await readline.question(prompt)).trim()
  } finally {
    readline.close()
  }
}
