#!/usr/bin/env node
/**
 * Runs notifications compile in the current repo.
 * Expects notifications/compile.config.mjs exporting default compile options loader.
 *
 * Flags:
 *   --force   Recompile prebuilt + preview regardless of input hash
 *   --preview Regenerate preview artifacts (prebuilt only when inputs changed)
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const frameworkRoot = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
)
const frameworkRequire = createRequire(path.join(frameworkRoot, 'package.json'))

function parseArgs(argv) {
    const force = argv.includes('--force')
    const preview = argv.includes('--preview')

    return {
        force,
        preview,
        includePreview: force || preview,
    }
}

async function loadFrameworkVersion() {
    const packageJson = JSON.parse(
        await fs.readFile(path.join(frameworkRoot, 'package.json'), 'utf8'),
    )

    return packageJson.version
}

async function verifyMessageSourcesUtf8(repoRoot) {
    const messagesDir = path.join(repoRoot, 'notifications', 'messages')
    try {
        await fs.access(messagesDir)
    } catch {
        return
    }

    const verifyScriptCandidates = [
        path.join(
            repoRoot,
            '../../dev-tools',
            '.cursor',
            'skills',
            'unicode-text-editing',
            'scripts',
            'verify-utf8-text.py',
        ),
        path.join(
            repoRoot,
            '../dev-tools',
            '.cursor',
            'skills',
            'unicode-text-editing',
            'scripts',
            'verify-utf8-text.py',
        ),
    ]

    let verifyScript
    for (const candidate of verifyScriptCandidates) {
        try {
            await fs.access(candidate)
            verifyScript = candidate
            break
        } catch {
            continue
        }
    }

    if (!verifyScript) {
        console.warn(
            `Skipping UTF-8 verify (script not found under ${repoRoot})`,
        )
        return
    }

    const result = spawnSync('python3', [verifyScript, messagesDir], {
        encoding: 'utf-8',
    })

    if (result.status !== 0) {
        process.stderr.write(
            result.stderr || result.stdout || 'UTF-8 verification failed\n',
        )
        process.exit(1)
    }

    if (result.stdout?.trim()) {
        console.log(result.stdout.trim())
    }
}

async function main() {
    const { force, preview, includePreview } = parseArgs(process.argv.slice(2))

    let repoRoot = process.cwd()
    if (path.basename(repoRoot) === 'notifications') {
        repoRoot = path.dirname(repoRoot)
    }

    const configPath = path.join(
        repoRoot,
        'notifications',
        'compile.config.mjs',
    )

    let configModule
    try {
        configModule = await import(pathToFileURL(configPath).href)
    } catch (error) {
        console.error(
            `Failed to load ${configPath}. Create notifications/compile.config.mjs in this repo.`,
        )
        console.error(error)
        process.exit(1)
    }

    const loadConfig = configModule.default ?? configModule.loadCompileConfig
    if (typeof loadConfig !== 'function') {
        console.error('compile.config.mjs must export default async function')
        process.exit(1)
    }

    const { compileNotifications } = frameworkRequire('./dist/src/compile.js')
    const { computeCompileInputsHash, getCompileStampPath, readCompileStamp } =
        frameworkRequire('./dist/src/compile-hash.js')

    const frameworkVersion = await loadFrameworkVersion()
    const options = await loadConfig({ repoRoot })

    await verifyMessageSourcesUtf8(repoRoot)

    const inputsHash = await computeCompileInputsHash({
        repoRoot,
        repoName: options.repoName,
        frameworkRoot,
        frameworkVersion,
        compileOptions: options,
    })

    const stampPath = getCompileStampPath(repoRoot, options.prebuiltDir)
    const existingStamp = await readCompileStamp(stampPath)
    const inputsUnchanged = existingStamp?.inputsHash === inputsHash

    if (!force && inputsUnchanged) {
        if (preview) {
            const result = await compileNotifications({
                ...options,
                includePreview: true,
                skipPrebuilt: true,
                frameworkRoot,
                frameworkVersion,
            })

            console.log(
                `Notifications unchanged; regenerated preview only -> ${result.manifestPath}`,
            )
            return
        }

        console.log(
            `Notifications unchanged, skipping compile (stamp: ${stampPath})`,
        )
        return
    }

    const result = await compileNotifications({
        ...options,
        includePreview,
        skipPrebuilt: false,
        frameworkRoot,
        frameworkVersion,
    })

    if (includePreview) {
        console.log(
            `Compiled notifications -> ${result.manifestPath} (stamp: ${stampPath})`,
        )
    } else {
        console.log(`Compiled notifications (stamp: ${stampPath})`)
    }
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
