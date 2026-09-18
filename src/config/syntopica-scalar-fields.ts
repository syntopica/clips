import { syntopicaValueAt } from './syntopica-value-at.ts'

/** The settings that are values rather than paths, read straight off the
 * merged document. Split out of `buildSyntopicaConfig` so neither half has to
 * be read to understand the other. */
export function syntopicaScalarFields(document: Record<string, unknown>) {
  return {
    inboxRepositoryUrl: syntopicaValueAt(
      document,
      'clips.inboxRepositoryUrl',
    ) as string | null,
    screeningScope: syntopicaValueAt(
      document,
      'capture.screeningScope',
    ) as string,
    schemaVersion: syntopicaValueAt(document, 'schemaVersion') as number,
    instanceId: syntopicaValueAt(document, 'instanceId') as string,
    brainApiVersion: syntopicaValueAt(
      document,
      'engines.brain.apiVersion',
    ) as number,
    clipsApiVersion: syntopicaValueAt(
      document,
      'engines.clips.apiVersion',
    ) as number,
    captureOrigin: syntopicaValueAt(document, 'capture.origin') as
      string | null,
    captureMirror: syntopicaValueAt(document, 'capture.mirror') as boolean,
    triageProfile: syntopicaValueAt(
      document,
      'newsletter.triageProfile',
    ) as string,
    triageTopics: Object.freeze([
      ...(syntopicaValueAt(document, 'newsletter.triageTopics') as string[]),
    ]),
    runners: Object.freeze({
      ...(syntopicaValueAt(document, 'runners') as Record<
        string,
        string | null
      >),
    }),
  }
}
