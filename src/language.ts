import type { SupportedLanguage } from './types'

const LANGUAGE_SET = new Set<string>(['he', 'en', 'de', 'it'])

export function isSupportedLanguage(value: string): value is SupportedLanguage {
    return LANGUAGE_SET.has(value)
}

export function normalizeLanguagePreference(
    languagePreference: string | null | undefined,
): SupportedLanguage | null {
    if (!languagePreference) {
        return null
    }

    const normalized = languagePreference.toLowerCase().slice(0, 2)

    return isSupportedLanguage(normalized) ? normalized : null
}

export function detectLanguageFromPhoneNumber(
    phoneNumber: string | undefined,
): SupportedLanguage | null {
    if (!phoneNumber) {
        return null
    }

    if (phoneNumber.startsWith('+972')) {
        return 'he'
    }
    if (phoneNumber.startsWith('+49')) {
        return 'de'
    }
    if (phoneNumber.startsWith('+39')) {
        return 'it'
    }

    return null
}

export function resolveLanguage(input: {
    languagePreference?: string | null
    phoneNumber?: string
    cognitoLocale?: string | null
}): SupportedLanguage {
    const fromPreference = normalizeLanguagePreference(input.languagePreference)
    if (fromPreference) {
        return fromPreference
    }

    const fromCognito = normalizeLanguagePreference(input.cognitoLocale)
    if (fromCognito) {
        return fromCognito
    }

    const fromPhone = detectLanguageFromPhoneNumber(input.phoneNumber)
    if (fromPhone) {
        return fromPhone
    }

    return 'he'
}

export function languageDirection(language: SupportedLanguage): 'rtl' | 'ltr' {
    return language === 'he' ? 'rtl' : 'ltr'
}
