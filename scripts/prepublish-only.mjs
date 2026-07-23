/**
 * Block direct `npm publish`. Releases must go through release-it
 * (`npm run release` / `npm run release:ci` / scripts/agent-release.sh).
 */
import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const markerPath = join(packageRoot, '.release-it-publishing')

function gitPorcelain() {
    return execSync('git status --porcelain', {
        cwd: packageRoot,
        encoding: 'utf8',
    }).trim()
}

if (existsSync(markerPath)) {
    process.exit(0)
}

if (gitPorcelain()) {
    console.error(
        'prepublish-only: working tree must be clean; commit first, then npm run release',
    )
    process.exit(1)
}

console.error(
    'prepublish-only: use npm run release or npm run release:ci (not npm publish)',
)
process.exit(1)
