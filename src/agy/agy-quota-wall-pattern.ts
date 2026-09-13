/** What agy prints when the model family's per-account quota is spent:
 * `Error: Individual quota reached. Please upgrade your subscription to
 * increase your limits. Resets in 3h1m57s.`
 *
 * The whole sentence is matched rather than the memorable half, for the same
 * reason the codex pattern is: this runner's stdout carries the model's own
 * prose, produced from an untrusted captured article. A clip whose text says "I
 * reached my individual quota" must not be able to trigger a transport switch.
 *
 * Narrow for a second reason. Quotas are **per model family**, so this is the
 * one agy failure a different model reliably clears - measured 2026-08-03, when
 * `claude-opus-4-6-thinking` returned this and `gemini-3.1-pro-high` answered
 * normally in the same minute. A timeout or an unparseable envelope says
 * nothing about the other family and must not switch anything.
 */
export const AGY_QUOTA_WALL_PATTERN =
  /individual quota reached\.\s*please upgrade your subscription/iu
