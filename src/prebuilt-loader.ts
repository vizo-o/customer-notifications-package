import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import type { PrebuiltEmailBundle, PrebuiltSmsBundle } from './render'

const emailCache = new Map<string, PrebuiltEmailBundle>()
const smsCache = new Map<string, PrebuiltSmsBundle>()

export function resolveNotificationsPrebuiltDir(
    serviceDirname: string,
): string {
    const configured = process.env.NOTIFICATIONS_PREBUILT_DIR?.trim()
    if (configured) {
        return configured
    }

    let current = path.resolve(serviceDirname)
    for (let depth = 0; depth < 8; depth++) {
        const candidate = path.join(current, 'notifications', 'prebuilt')
        if (existsSync(candidate)) {
            return candidate
        }

        const parent = path.dirname(current)
        if (parent === current) {
            break
        }
        current = parent
    }

    return path.join(serviceDirname, '../../../notifications/prebuilt')
}

export async function loadPrebuiltEmailBundle(options: {
    serviceDirname: string
    messageId: string
    variant?: string
}): Promise<PrebuiltEmailBundle> {
    const cacheKey = `${options.messageId}:${options.variant ?? 'default'}`
    const cached = emailCache.get(cacheKey)
    if (cached) {
        return cached
    }

    const fileName = options.variant
        ? `${options.messageId}.${options.variant}.json`
        : `${options.messageId}.json`
    const raw = await fs.readFile(
        path.join(
            resolveNotificationsPrebuiltDir(options.serviceDirname),
            fileName,
        ),
        'utf8',
    )
    const parsed = JSON.parse(raw) as PrebuiltEmailBundle
    emailCache.set(cacheKey, parsed)

    return parsed
}

export async function loadPrebuiltSmsBundle(options: {
    serviceDirname: string
    messageId: string
    variant?: string
}): Promise<PrebuiltSmsBundle> {
    const cacheKey = `${options.messageId}:${options.variant ?? 'default'}`
    const cached = smsCache.get(cacheKey)
    if (cached) {
        return cached
    }

    const fileName = options.variant
        ? `${options.messageId}.${options.variant}.sms.json`
        : `${options.messageId}.sms.json`
    const raw = await fs.readFile(
        path.join(
            resolveNotificationsPrebuiltDir(options.serviceDirname),
            fileName,
        ),
        'utf8',
    )
    const parsed = JSON.parse(raw) as PrebuiltSmsBundle
    smsCache.set(cacheKey, parsed)

    return parsed
}
