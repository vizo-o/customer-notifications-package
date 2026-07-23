#!/usr/bin/env node
/**
 * Ensures @vizo-o/customer-notifications dist is available before compile.
 * Published installs ship prebuilt dist; local package dev runs tsc when src changes.
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

async function pathExists(candidate) {
    try {
        await fs.access(candidate)
        return true
    } catch {
        return false
    }
}

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
    const srcDir = path.join(packageRoot, 'src')
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
        const raw = await fs.readFile(
            path.join(packageRoot, BUILD_STAMP_FILE),
            'utf8',
        )

        return JSON.parse(raw)
    } catch {
        return null
    }
}

async function main() {
    const distEntry = path.join(packageRoot, 'dist', 'src', 'index.js')
    const hasBuildableSources =
        (await pathExists(path.join(packageRoot, 'tsconfig.json'))) &&
        (await pathExists(path.join(packageRoot, 'src')))

    let distExists = false
    try {
        await fs.access(distEntry)
        distExists = true
    } catch {
        distExists = false
    }

    if (!hasBuildableSources) {
        if (distExists) {
            console.log(
                'Using prebuilt @vizo-o/customer-notifications dist from npm',
            )
            return
        }

        console.error(
            'Missing @vizo-o/customer-notifications dist. Reinstall the package.',
        )
        process.exit(1)
    }

    const srcHash = await computeSrcHash()
    const existingStamp = await readBuildStamp()

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
        path.join(packageRoot, BUILD_STAMP_FILE),
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
