import {
    detectLanguageFromPhoneNumber,
    isSupportedLanguage,
    normalizeLanguagePreference,
    resolveLanguage,
} from '../src/language'

describe('language resolver', () => {
    it('detects supported languages', () => {
        expect(isSupportedLanguage('he')).toBe(true)
        expect(isSupportedLanguage('fr')).toBe(false)
    })

    it('normalizes language preference', () => {
        expect(normalizeLanguagePreference('EN-us')).toBe('en')
        expect(normalizeLanguagePreference('xx')).toBeNull()
    })

    it('detects language from phone country codes', () => {
        expect(detectLanguageFromPhoneNumber('+972501234567')).toBe('he')
        expect(detectLanguageFromPhoneNumber('+49123456789')).toBe('de')
        expect(detectLanguageFromPhoneNumber('+39123456789')).toBe('it')
        expect(detectLanguageFromPhoneNumber('+14155551234')).toBeNull()
    })

    it('resolves language with preference over phone', () => {
        expect(
            resolveLanguage({
                languagePreference: 'de',
                phoneNumber: '+972501234567',
            }),
        ).toBe('de')
    })

    it('falls back to he when nothing matches', () => {
        expect(resolveLanguage({})).toBe('he')
    })
})
