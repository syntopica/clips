import type { IncomingMessage } from 'node:http'

/** A fake server's view of a request body: parsed JSON, or null when empty. */
export const readRequestJson = async (
  request: IncomingMessage,
): Promise<unknown> => {
  let text = ''
  for await (const chunk of request) text += String(chunk)
  return text === '' ? null : JSON.parse(text)
}
