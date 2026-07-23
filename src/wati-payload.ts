import { WatiLocaleNotAvailableError } from './errors'
import type { SupportedLanguage, WatiLocaleMap, WatiLocaleSpec } from './types'

export interface PrebuiltWatiBundle {
    id: string
    variant?: string
    locales: WatiLocaleMap
}

export interface WatiSendPayload {
    template_name: string
    broadcast_name: string
    parameters: Array<{ name: string; value: string }>
}

export function getWatiSpecFromPrebuilt(
    bundle: PrebuiltWatiBundle,
    locale: SupportedLanguage,
): WatiLocaleSpec {
    const spec = bundle.locales[locale]
    if (!spec) {
        const availableLocales = (
            Object.keys(bundle.locales) as SupportedLanguage[]
        ).filter((entry) => bundle.locales[entry] !== undefined)

        throw new WatiLocaleNotAvailableError({
            bundleId: bundle.id,
            requestedLocale: locale,
            availableLocales,
            reason: 'locale_not_defined',
        })
    }

    return spec
}

export function buildWatiSendPayload(
    spec: WatiLocaleSpec,
    params: Record<string, string | undefined>,
    options?: { broadcastName?: string },
): WatiSendPayload {
    const parameters = spec.paramKeys.map((key) => {
        const value = params[key]
        if (value === undefined || value === '') {
            throw new Error(`Missing WATI parameter "${key}"`)
        }

        return { name: key, value }
    })

    return {
        template_name: spec.elementName,
        broadcast_name: options?.broadcastName ?? 'customer-notification',
        parameters,
    }
}
