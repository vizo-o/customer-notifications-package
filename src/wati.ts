import type { SupportedLanguage } from './types'
import { WatiLocaleNotAvailableError } from './errors'
import type { RegisteredMessage, WatiLocaleMap, WatiLocaleSpec } from './types'

export function getWatiAvailableLocales(
    wati: WatiLocaleMap | undefined,
): SupportedLanguage[] {
    if (!wati) {
        return []
    }

    return (Object.keys(wati) as SupportedLanguage[]).filter(
        (locale) => wati[locale] !== undefined,
    )
}

export function getWatiSpec(
    message: RegisteredMessage,
    locale: SupportedLanguage,
): WatiLocaleSpec {
    const wati = message.channels.wati
    if (!wati) {
        throw new WatiLocaleNotAvailableError({
            bundleId: message.id,
            requestedLocale: locale,
            availableLocales: [],
            reason: 'no_wati_channel',
        })
    }

    const spec = wati[locale]
    if (!spec) {
        throw new WatiLocaleNotAvailableError({
            bundleId: message.id,
            requestedLocale: locale,
            availableLocales: getWatiAvailableLocales(wati),
            reason: 'locale_not_defined',
        })
    }

    return spec
}

export function defineWatiChannel<T extends WatiLocaleMap>(locales: T): T {
    const keys = Object.keys(locales)
    if (keys.length === 0) {
        throw new Error('WATI channel must define at least one locale')
    }

    return locales
}
