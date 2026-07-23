import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import type { CompileOptions } from './compile'

export const COMPILE_STAMP_FILE = '.compile-stamp.json'

export interface CompileStamp {
    inputsHash: string
    compiledAt: string
    frameworkVersion: string
    repoName: string
}

export interface CompileHashInputs {
    repoRoot: string
    repoName: string
    frameworkRoot: string
    frameworkVersion: string
    compileOptions: Pick<
        CompileOptions,
        | 'env'
        | 'variants'
        | 'prebuildAllEmail'
        | 'prebuiltOutputs'
        | 'sampleParams'
        | 'prebuiltDir'
        | 'previewDir'
    >
}

const NOTIFICATION_SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.mjs'])

const FRAMEWORK_SOURCE_EXTENSIONS = new Set(['.ts', '.tsx'])

async function hashFileContent(
    hasher: crypto.Hash,
    filePath: string,
): Promise<void> {
    const content = await fs.readFile(filePath)
    hasher.update(filePath)
    hasher.update('\0')
    hasher.update(content)
    hasher.update('\0')
}

async function walkAndHash(
    dir: string,
    hasher: crypto.Hash,
    extensions: Set<string>,
): Promise<void> {
    let entries
    try {
        entries = await fs.readdir(dir, { withFileTypes: true })
    } catch {
        return
    }

    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            await walkAndHash(fullPath, hasher, extensions)
        } else if (extensions.has(path.extname(entry.name))) {
            await hashFileContent(hasher, fullPath)
        }
    }
}

function normalizeCompileOptionsForHash(
    repoRoot: string,
    options: CompileHashInputs['compileOptions'],
): Record<string, unknown> {
    const prebuiltOutputs = options.prebuiltOutputs
        ?.map((entry) => ({
            messageId: entry.messageId,
            outputPath: path.relative(repoRoot, entry.outputPath),
            smsOutputPath: entry.smsOutputPath
                ? path.relative(repoRoot, entry.smsOutputPath)
                : undefined,
        }))
        .sort((a, b) => a.messageId.localeCompare(b.messageId))

    const variants = options.variants
        ? Object.fromEntries(
              Object.entries(options.variants)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([messageId, variantList]) => [
                      messageId,
                      [...variantList].sort(),
                  ]),
          )
        : undefined

    return {
        env: options.env ?? 'dev',
        prebuildAllEmail: options.prebuildAllEmail ?? false,
        prebuiltDir: options.prebuiltDir
            ? path.relative(repoRoot, options.prebuiltDir)
            : 'notifications/prebuilt',
        previewDir: options.previewDir
            ? path.relative(repoRoot, options.previewDir)
            : '.notifications-preview',
        prebuiltOutputs,
        sampleParams: options.sampleParams ?? {},
        variants,
    }
}

export async function computeCompileInputsHash(
    inputs: CompileHashInputs,
): Promise<string> {
    const hasher = crypto.createHash('sha256')

    hasher.update(inputs.frameworkVersion)
    hasher.update('\0')
    hasher.update(
        JSON.stringify(
            normalizeCompileOptionsForHash(
                inputs.repoRoot,
                inputs.compileOptions,
            ),
        ),
    )
    hasher.update('\0')

    const notificationsDir = path.join(inputs.repoRoot, 'notifications')
    const explicitFiles = [
        path.join(notificationsDir, 'index.ts'),
        path.join(notificationsDir, 'compile.config.mjs'),
    ]

    for (const filePath of explicitFiles) {
        await hashFileContent(hasher, filePath)
    }

    await walkAndHash(
        path.join(notificationsDir, 'messages'),
        hasher,
        NOTIFICATION_SOURCE_EXTENSIONS,
    )

    const frameworkSrc = path.join(inputs.frameworkRoot, 'src')
    const frameworkDist = path.join(inputs.frameworkRoot, 'dist', 'src')

    try {
        await fs.access(path.join(frameworkSrc, 'index.ts'))
        await walkAndHash(frameworkSrc, hasher, FRAMEWORK_SOURCE_EXTENSIONS)
    } catch {
        await walkAndHash(frameworkDist, hasher, new Set(['.js', '.d.ts']))
    }

    return hasher.digest('hex')
}

export function getCompileStampPath(
    repoRoot: string,
    prebuiltDir?: string,
): string {
    const dir = prebuiltDir ?? path.join(repoRoot, 'notifications', 'prebuilt')

    return path.join(dir, COMPILE_STAMP_FILE)
}

export async function readCompileStamp(
    stampPath: string,
): Promise<CompileStamp | null> {
    try {
        const raw = await fs.readFile(stampPath, 'utf8')

        return JSON.parse(raw) as CompileStamp
    } catch {
        return null
    }
}

export async function writeCompileStamp(
    stampPath: string,
    stamp: CompileStamp,
): Promise<void> {
    await fs.mkdir(path.dirname(stampPath), { recursive: true })
    await fs.writeFile(stampPath, `${JSON.stringify(stamp, null, 2)}\n`, 'utf8')
}
