import { createBaseConfig } from '@busirocket/eslint-config/base'
import { createCodeQualityConfig } from '@busirocket/eslint-config/code-quality'
import { createNodeConfig } from '@busirocket/eslint-config/node'

export default [
  ...createBaseConfig({ tsconfigRootDir: import.meta.dirname }),
  ...createNodeConfig(),
  ...createCodeQualityConfig(),
  {
    // This package's entire job is filesystem and git work on computed paths, so
    // the rule fires on nearly every call and finds nothing. It accounted for 20
    // of the 30 warnings before milestone 2 and would bury real ones.
    files: ['src/**/*.ts'],
    rules: { 'security/detect-non-literal-fs-filename': 'off' },
  },
]
