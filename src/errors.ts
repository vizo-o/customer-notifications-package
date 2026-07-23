export class WatiLocaleNotAvailableError extends Error {
    readonly bundleId: string
    readonly requestedLocale: string
    readonly availableLocales: readonly string[]
    readonly reason: 'no_wati_channel' | 'locale_not_defined'

    constructor(options: {
        bundleId: string
        requestedLocale: string
        availableLocales: readonly string[]
        reason: 'no_wati_channel' | 'locale_not_defined'
    }) {
        super(
            options.reason === 'no_wati_channel'
                ? `Message "${options.bundleId}" has no WATI channel`
                : `WATI locale "${options.requestedLocale}" is not available for message "${options.bundleId}". Available: ${options.availableLocales.join(', ') || 'none'}`,
        )
        this.name = 'WatiLocaleNotAvailableError'
        this.bundleId = options.bundleId
        this.requestedLocale = options.requestedLocale
        this.availableLocales = options.availableLocales
        this.reason = options.reason
    }
}

export class NotificationParamValidationError extends Error {
    readonly bundleId: string

    constructor(bundleId: string, message: string) {
        super(`Invalid params for message "${bundleId}": ${message}`)
        this.name = 'NotificationParamValidationError'
        this.bundleId = bundleId
    }
}
