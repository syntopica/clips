/** Serialize self-contained page functions without executing the page client. */
export function serializePageCall(entry, helpers) {
  return `;(${entry.toString()})({${Object.entries(helpers)
    .map(([name, fn]) => `${name}: (${fn.toString()})`)
    .join(',')}})`
}
