import { buildSyntopicaConfig } from '../config/build-syntopica-config.ts'
import { withSyntopicaConfig } from '../config/with-syntopica-config.ts'
import { syntopicaConfigTestState } from './syntopica-config-test-state.ts'

/** Run `body` inside a freshly built fixture instance's configuration. */
export const withFixtureSyntopicaConfig = async <T>(
  body: () => Promise<T>,
): Promise<T> => {
  const { document, origins, data, schema } = syntopicaConfigTestState()
  const config = buildSyntopicaConfig({
    document,
    origins,
    root: data,
    environ: {},
    schema,
  })
  return withSyntopicaConfig(config, body)
}
