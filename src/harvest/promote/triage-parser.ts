import type { TickedArticle } from './ticked-article.ts'

/** How one triage topic file is read into articles.
 *
 * Two implementations exist and the difference is a policy, not a detail:
 * `parseTickedArticles` treats a tick as an instruction, which answers "what
 * does the user want ingested"; `parseAllArticles` reads every entry, which
 * answers "what should be on disk". Capture is not a judgement, so the second
 * is what the capture stage uses.
 * SPEC: docs/superpowers/specs/2026-07-30-capture-first-pipeline-design.md */
export type TriageParser = (markdown: string, topic: string) => TickedArticle[]
