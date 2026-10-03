/** Machine codes for `clips doctor --json`. A code never carries a path, a
 * command name or any other instance value: those stay in the human message,
 * and a consumer that stores the JSON stores no content (orbit design 6.6).
 * Codes for a passing check name what the pass still has to say. */
export type DoctorCode =
  | 'ok'
  | 'config_invalid'
  | 'paths_missing'
  | 'paths_state_absent'
  | 'repositories_invalid'
  | 'archive_remotes_uninspectable'
  | 'archive_remotes_unresolvable'
  | 'archive_public_remote'
  | 'ingest_publication_unconfigured'
  | 'api_unsupported'
  | 'executables_missing'
  | 'credentials_not_required'
  | 'credentials_absent'
