import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {
    computeCompileInputsHash,
    getCompileStampPath,
    readCompileStamp,
    writeCompileStamp,
} from '../src/compile-hash'

describe('compile-hash', () => {
    it('returns the same hash for unchanged inputs', async () => {
        const repoRoot = await fs.mkdtemp(
            path.join(os.tmpdir(), 'notifications-hash-'),
        )
        const frameworkRoot = path.join(repoRoot, 'framework')
        const notificationsDir = path.join(repoRoot, 'notifications')

        await fs.mkdir(path.join(notificationsDir, 'messages'), {
            recursive: true,
        })
        await fs.mkdir(path.join(frameworkRoot, 'src'), { recursive: true })

        await fs.writeFile(
            path.join(notificationsDir, 'index.ts'),
            'export const notificationMessages = []\n',
            'utf8',
        )
        await fs.writeFile(
            path.join(notificationsDir, 'compile.config.mjs'),
            'export default async () => ({ repoName: "test" })\n',
            'utf8',
        )
        await fs.writeFile(
            path.join(notificationsDir, 'messages', 'sample.tsx'),
            'export const sample = 1\n',
            'utf8',
        )
        await fs.writeFile(
            path.join(frameworkRoot, 'src', 'render.ts'),
            'export const renderEmail = () => null\n',
            'utf8',
        )
        await fs.writeFile(
            path.join(frameworkRoot, 'package.json'),
            JSON.stringify({ version: '0.1.0' }),
            'utf8',
        )

        const baseInputs = {
            repoRoot,
            repoName: 'test-repo',
            frameworkRoot,
            frameworkVersion: '0.1.0',
            compileOptions: {
                env: 'dev' as const,
                prebuildAllEmail: true,
            },
        }

        const firstHash = await computeCompileInputsHash(baseInputs)
        const secondHash = await computeCompileInputsHash(baseInputs)

        expect(firstHash).toBe(secondHash)

        await fs.appendFile(
            path.join(notificationsDir, 'messages', 'sample.tsx'),
            '\nexport const changed = 2\n',
            'utf8',
        )

        const changedHash = await computeCompileInputsHash(baseInputs)

        expect(changedHash).not.toBe(firstHash)
    })

    it('reads and writes compile stamp files', async () => {
        const repoRoot = await fs.mkdtemp(
            path.join(os.tmpdir(), 'notifications-stamp-'),
        )
        const prebuiltDir = path.join(repoRoot, 'notifications', 'prebuilt')
        const stampPath = getCompileStampPath(repoRoot, prebuiltDir)
        const stamp = {
            inputsHash: 'abc123',
            compiledAt: '2026-07-23T00:00:00.000Z',
            frameworkVersion: '0.1.0',
            repoName: 'test-repo',
        }

        expect(await readCompileStamp(stampPath)).toBeNull()

        await writeCompileStamp(stampPath, stamp)

        expect(await readCompileStamp(stampPath)).toEqual(stamp)
    })
})
