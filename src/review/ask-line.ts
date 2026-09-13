import { createInterface } from 'node:readline/promises'

/** One prompted line from the terminal. A fresh readline interface per
 * question, closed immediately: keeping one open holds the process alive and
 * swallows stdin between the synthesizer's wait and the reviewer's prompt. */
export const askLine = async (prompt: string): Promise<string> => {
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  try {
    return (await readline.question(prompt)).trim().toLowerCase()
  } finally {
    readline.close()
  }
}
