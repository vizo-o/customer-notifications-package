#!/usr/bin/env node
/**
 * Runs `tsc` only when customer-notifications-package src changed.
 */
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const BUILD_STAMP_FILE = '.build-stamp.json'
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx'])

const packageRoot = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
)
const srcDir = path.join(packageRoot, 'src')
const distEntry = path.join(packageRoot, 'dist', 'src', 'index.js')
const stampPath = path.join(packageRoot, BUILD_STAMP_FILE)

async function hashFileContent(hasher, filePath) {
    const content = await fs.readFile(filePath)
    hasher.update(filePath)
    hasher.update('\0')
    hasher.update(content)
    hasher.update('\0')
}

async function walkAndHash(dir, hasher) {
    let entries
    try {
        entries = await fs.readdir(dir, { withFileTypes: true })
    } catch {
        return
    }

    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            await walkAndHash(fullPath, hasher)
        } else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
            await hashFileContent(hasher, fullPath)
        }
    }
}

async function computeSrcHash() {
    const hasher = crypto.createHash('sha256')
    const packageJson = JSON.parse(
        await fs.readFile(path.join(packageRoot, 'package.json'), 'utf8'),
    )
    hasher.update(packageJson.version)
    hasher.update('\0')
    await walkAndHash(srcDir, hasher)

    return hasher.digest('hex')
}

async function readBuildStamp() {
    try {
        const raw = await fs.readFile(stampPath, 'utf8')

        return JSON.parse(raw)
    } catch {
        return null
    }
}

async function main() {
    const srcHash = await computeSrcHash()
    const existingStamp = await readBuildStamp()

    let distExists = false
    try {
        await fs.access(distEntry)
        distExists = true
    } catch {
        distExists = false
    }

    if (
        existingStamp?.srcHash === srcHash &&
        distExists &&
        !process.argv.includes('--force')
    ) {
        console.log('customer-notifications-package unchanged, skipping tsc')
        return
    }

    const result = spawnSync('npm', ['run', 'build'], {
        cwd: packageRoot,
        stdio: 'inherit',
        shell: process.platform === 'win32',
    })

    if (result.status !== 0) {
        process.exit(result.status ?? 1)
    }

    await fs.writeFile(
        stampPath,
        `${JSON.stringify(
            {
                srcHash,
                builtAt: new Date().toISOString(),
            },
            null,
            2,
        )}\n`,
        'utf8',
    )
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
