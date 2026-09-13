export function doctorPublicRemote(value: string): boolean {
  const normalized = value.replace(
    /^(?:[^/@]+@)?github\.com:/iu,
    'ssh://github.com/',
  )
  if (!URL.canParse(normalized)) return false
  const parsed = new URL(normalized)
  let decoded: string
  try {
    decoded = decodeURIComponent(parsed.pathname)
  } catch {
    return false
  }
  const path = decoded
    .replace(/^\/+|\/+$/gu, '')
    .replace(/\.git$/iu, '')
    .toLowerCase()
  return (
    parsed.hostname.toLowerCase() === 'github.com' &&
    ['syntopica/brain', 'syntopica/clips'].includes(path)
  )
}
