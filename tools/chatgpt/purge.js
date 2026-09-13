import { buildPurgeScript } from './purge/build-purge-script.js'

process.stdout.write(buildPurgeScript() + '\n')
