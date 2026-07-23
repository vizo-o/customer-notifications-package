import { render } from '@react-email/render'
import type {
    EmailTheme,
    RegisteredMessage,
    RenderedEmail,
    SupportedLanguage,
} from './types'
import { NotificationParamValidationError } from './errors'
import { parseMessageParams } from './define-message'
import { resolveFromAddress } from './sms'
import { formatSms, substituteParams } from './sms'

export async function renderEmail<
    TParams extends Record<string, unknown>,
>(options: {
    message: RegisteredMessage<TParams>
    language: SupportedLanguage
    params: unknown
    theme?: EmailTheme
    assetBaseUrl: string
    env: 'prod' | 'dev'
    variant?: string
}): Promise<RenderedEmail> {
    const emailChannel = options.message.channels.email
    if (!emailChannel) {
        throw new Error(`Message "${options.message.id}" has no email channel`)
    }

    let parsed: TParams
    try {
        parsed = parseMessageParams(options.message, options.params)
    } catch (error) {
        throw new NotificationParamValidationError(
            options.message.id,
            error instanceof Error ? error.message : String(error),
        )
    }

    const theme = options.theme ?? 'light'
    const element = emailChannel.component({
        ...parsed,
        language: options.language,
        theme,
        assetBaseUrl: options.assetBaseUrl,
    })

    const htmlBody = await render(element)
    const textBody = await render(element, { plainText: true })
    const subject = emailChannel.subjects[options.language]

    return {
        subject,
        htmlBody,
        textBody,
        from: resolveFromAddress({
            env: options.env,
            messageDefaultFrom: options.message.defaultFrom,
            channelFrom: emailChannel.from,
        }),
    }
}

export function renderSmsMessage<
    TParams extends Record<string, unknown>,
>(options: {
    message: RegisteredMessage<TParams>
    language: SupportedLanguage
    params: unknown
    variant?: string
}): string {
    const smsChannel = options.message.channels.sms
    if (!smsChannel) {
        throw new Error(`Message "${options.message.id}" has no SMS channel`)
    }

    let parsed: TParams
    try {
        parsed = parseMessageParams(options.message, options.params)
    } catch (error) {
        throw new NotificationParamValidationError(
            options.message.id,
            error instanceof Error ? error.message : String(error),
        )
    }

    const bodies =
        typeof smsChannel.bodies === 'function'
            ? smsChannel.bodies(parsed, options.variant as never)
            : smsChannel.bodies

    const rawBody = substituteParams(
        bodies[options.language],
        parsed as Record<string, string | number>,
    )

    if (smsChannel.format === 'structured') {
        return rawBody
    }

    return formatSms({
        body: rawBody,
        language: options.language,
    })
}

export function renderPrebuiltEmail(options: {
    prebuilt: PrebuiltEmailBundle
    language: SupportedLanguage
    params: Record<string, string | number>
    env: 'prod' | 'dev'
    fromOverride?: string
}): RenderedEmail {
    const langEntry = options.prebuilt.languages[options.language]
    if (!langEntry) {
        throw new Error(
            `Prebuilt email for "${options.prebuilt.id}" missing language "${options.language}"`,
        )
    }

    return {
        subject: langEntry.subject,
        htmlBody: substituteParams(langEntry.html, options.params),
        textBody: substituteParams(langEntry.text, options.params),
        from:
            options.fromOverride ??
            options.prebuilt.from ??
            resolveFromAddress({ env: options.env }),
    }
}

export interface PrebuiltEmailLanguage {
    subject: string
    html: string
    text: string
}

export interface PrebuiltEmailBundle {
    id: string
    from?: string
    languages: Partial<Record<SupportedLanguage, PrebuiltEmailLanguage>>
}

export function renderPrebuiltSms(options: {
    prebuilt: PrebuiltSmsBundle
    language: SupportedLanguage
    params: Record<string, string | number>
}): string {
    const langEntry = options.prebuilt.languages[options.language]
    if (!langEntry) {
        throw new Error(
            `Prebuilt SMS for "${options.prebuilt.id}" missing language "${options.language}"`,
        )
    }

    return substituteParams(langEntry, options.params)
}

export interface PrebuiltSmsBundle {
    id: string
    variant?: string
    languages: Partial<Record<SupportedLanguage, string>>
}
