export const USAGE_TEXT = `clips - ingest capture archive captures into the brain

  clips --data <path> <command>  select a syntopica.config.json data directory
  clips doctor                   check paths, repositories and runtime availability

  clips pull                     clone or fast-forward the configured capture archive
  clips status                   print each clip's derived state and evidence
  clips ingest [options]         run the ingest pipeline
  clips harvest [options]        harvest newsletters and saved articles into clips
  clips grade --page <path>...   grade pages against the clips they cite
  clips audit                    source drift, unresolved citations, hand edits
  clips requeue --clip <id>      send a clip escalated by a transport failure
                                 back to pending
  clips reconcile --cited        ledger the pending clips whose urls the wiki
                                 already cites and move them to processed
  clips drain [options]          take the phone's captures out of the capture
                                 service and into the clip store

Options for ingest:
  --clip <clip_id>               process one clip only
  --dry-run                      change nothing, print what would happen
  --manual                       human/Claude synthesizer instead of codex
  --grade                        grade each new page against the clips it cites
  --auto-review                  let agy read the diff instead of prompting;
                                 new pages and index.md still need a person

Options for harvest:
  --source <name>                harvest one source only (newsletter, medium-list)
  --dry-run                      change nothing, print what would happen
  --promote                      ingest the items ticked in the triage output
  --capture-all                  promote every entry, not only the ticked ones
  --date <YYYY-MM-DD>            act on that triage run instead of today's
  --since <YYYY-MM-DD>           read mail from that day instead of from the
                                 last run that read newsletters

Options for drain:
  --dry-run                      list the inbox, fetch nothing, mark nothing
  --limit <n>                    take at most n captures (default 200)

Options for reconcile:
  --cited                        the only mode today; required
  --dry-run                      list the clips that would reconcile, write
                                 nothing

Options for grade:
  --page <path>                  a wiki page, repeatable; exit 2 on any finding
`
