import { writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const markerPath = join(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    '.release-it-publishing',
)

writeFileSync(markerPath, '')
