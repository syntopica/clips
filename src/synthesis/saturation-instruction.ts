/** What every synthesis transport tells its model before it adds to a catalog.
 *
 * Measured on 2026-09-11: `topics/infrastructure-tool-catalog.md` absorbed four
 * "N CLI tools" articles in one batch, and the fifth and sixth named `rg`,
 * `fd`, `fzf`, `bat`, `jq` and `zoxide` again, each as a fresh section. Four of
 * that batch's seven gate rejections were this and nothing else.
 *
 * The screen ahead of synthesis cannot catch it: it reads the clip and never
 * the wiki, so an article listing ten useful tools is exactly what it is told
 * to keep. The model writing the page is the first step that can see both, so
 * the check belongs here rather than in the classifier.
 *
 * It asks for a subtraction, not a judgement about quality. An article whose
 * every named tool is already on the page leaves nothing to write, and saying
 * so is a better outcome than a section that restates the page back to it. */
export const SATURATION_INSTRUCTION = `- Before adding a list of named things to a page that already holds such a
  list - tools, commands, extensions, libraries - read what that page already
  names and keep only what is new. Do not restate an entry the page has, even
  under a different heading, and do not open a new section for a set that
  overlaps an existing one: add the new entries to the section that is already
  there. If nothing in the clip is new to the page, say so and write nothing
  rather than writing a section that repeats it.`
