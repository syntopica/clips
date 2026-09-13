/** Read the account and access token from the logged-in page. */
export async function readSession() {
  const account = (
    document.cookie.split('; ').find((c) => c.indexOf('_account=') === 0) || ''
  ).slice(9)
  const session = await (await fetch('/api/auth/session')).json()
  const token = session.accessToken

  return { account, token }
}
