import type { ReactElement } from 'react'
import type { ZodType } from 'zod'

export const SUPPORTED_LANGUAGES = ['he', 'en', 'de', 'it'] as const

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export type NotificationChannel = 'email' | 'sms' | 'wati'

export type EmailTheme = 'light' | 'dark'

export interface RenderedEmail {
    subject: string
    htmlBody: string
    textBody: string
    from: string
}

export interface WatiLocaleSpec {
    elementName: string
    paramKeys: readonly string[]
    referenceBody: string
    extractedAt: string
}

export type WatiLocaleMap = Partial<Record<SupportedLanguage, WatiLocaleSpec>>

export interface LocalizedEmailSubjects {
    he: string
    en: string
    de: string
    it: string
}

export interface LocalizedSmsBodies {
    he: string
    en: string
    de: string
    it: string
}

export type EmailComponentProps<TParams> = TParams & {
    language: SupportedLanguage
    theme: EmailTheme
    assetBaseUrl: string
}

export type EmailComponent<TParams> = (
    props: EmailComponentProps<TParams>,
) => ReactElement

export interface RegisteredMessage<
    TParams extends Record<string, unknown> = Record<string, unknown>,
    TVariant extends string = never,
> {
    id: string
    paramsSchema: ZodType<TParams>
    variants?: readonly TVariant[]
    defaultFrom?: string
    channels: {
        email?: {
            subjects: LocalizedEmailSubjects
            component: EmailComponent<TParams>
            from?: string
        }
        sms?: {
            bodies:
                | LocalizedSmsBodies
                | ((params: TParams, variant?: TVariant) => LocalizedSmsBodies)
            format?: 'structured'
        }
        wati?:
            WatiLocaleMap | ((variant?: TVariant) => WatiLocaleMap | undefined)
    }
}

export interface CompileManifestEntry {
    id: string
    variants: string[]
    paramsJsonSchema: Record<string, unknown>
    emailLanguages: SupportedLanguage[]
    smsLanguages: SupportedLanguage[]
    watiAvailableLocales: SupportedLanguage[]
    previewPaths: Record<string, string>
}

export interface CompileManifest {
    repoName: string
    compiledAt: string
    assetBaseUrl: string
    bundles: CompileManifestEntry[]
}
