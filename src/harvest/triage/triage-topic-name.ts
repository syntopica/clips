/** One triage topic: a slug from the instance's `newsletter.triageTopics`, or
 * `other`. A string rather than a union because the list is configuration,
 * which the schema constrains to slugs since each names a `<topic>.md` file. */
export type TriageTopicName = string
