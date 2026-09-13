// The package ships no types. Copied from brain-clipper's declaration of the
// same module, so both lanes describe the plugin identically.
declare module 'turndown-plugin-gfm' {
  import type TurndownService from 'turndown'

  export function gfm(service: TurndownService): void
  export function tables(service: TurndownService): void
  export function strikethrough(service: TurndownService): void
  export function taskListItems(service: TurndownService): void
}
