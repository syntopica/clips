/** The fixed identity of each `clips doctor` check, stable across releases so
 * a consumer of `clips doctor --json` can key on it. */
export type DoctorCheckName =
  | 'configuration'
  | 'paths'
  | 'repositories'
  | 'archive'
  | 'ingest'
  | 'api'
  | 'executables'
  | 'credentials'
