import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { resolveNotificationsPrebuiltDir } from '../src/prebuilt-loader'

describe('resolveNotificationsPrebuiltDir', () => {
    const originalEnv = process.env.NOTIFICATIONS_PREBUILT_DIR

    afterEach(() => {
        if (originalEnv === undefined) {
            delete process.env.NOTIFICATIONS_PREBUILT_DIR
        } else {
            process.env.NOTIFICATIONS_PREBUILT_DIR = originalEnv
        }
    })

    it('prefers NOTIFICATIONS_PREBUILT_DIR when set', () => {
        process.env.NOTIFICATIONS_PREBUILT_DIR = '/custom/prebuilt'
        expect(resolveNotificationsPrebuiltDir('/any/service/dir')).toBe(
            '/custom/prebuilt',
        )
    })

    it('finds prebuilt when service is under dist/notifications', () => {
        delete process.env.NOTIFICATIONS_PREBUILT_DIR

        const appRoot = mkdtempSync(path.join(tmpdir(), 'vizo-app-'))
        const prebuiltDir = path.join(appRoot, 'notifications', 'prebuilt')
        mkdirSync(prebuiltDir, { recursive: true })
        writeFileSync(path.join(prebuiltDir, 'sample.json'), '{}')

        const serviceDir = path.join(appRoot, 'dist', 'notifications')
        mkdirSync(serviceDir, { recursive: true })

        expect(resolveNotificationsPrebuiltDir(serviceDir)).toBe(prebuiltDir)
    })

    it('finds prebuilt when service is under dist/src/notifications', () => {
        delete process.env.NOTIFICATIONS_PREBUILT_DIR

        const appRoot = mkdtempSync(path.join(tmpdir(), 'vizo-app-'))
        const prebuiltDir = path.join(appRoot, 'notifications', 'prebuilt')
        mkdirSync(prebuiltDir, { recursive: true })
        writeFileSync(path.join(prebuiltDir, 'sample.json'), '{}')

        const serviceDir = path.join(appRoot, 'dist', 'src', 'notifications')
        mkdirSync(serviceDir, { recursive: true })

        expect(resolveNotificationsPrebuiltDir(serviceDir)).toBe(prebuiltDir)
    })
})
