import { isSyntopicaObject } from './is-syntopica-object.ts'

export function mergeSyntopicaDocuments(
  base: Record<string, unknown>,
  overlay: Record<string, unknown>,
): Record<string, unknown> {
  const result = structuredClone(base)
  for (const [key, value] of Object.entries(overlay)) {
    const previous = result[key]
    Object.defineProperty(result, key, {
      value:
        isSyntopicaObject(previous) && isSyntopicaObject(value)
          ? mergeSyntopicaDocuments(previous, value)
          : structuredClone(value),
      enumerable: true,
      configurable: true,
      writable: true,
    })
  }
  return result
}
