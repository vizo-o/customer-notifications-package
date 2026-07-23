import type { SupportedLanguage } from './types'

export function getDefaultFromAddress(env: 'prod' | 'dev'): string {
    return env === 'prod' ? 'noreply@sparkles-adhd.com' : 'dev@vizo-o.com'
}

export function resolveFromAddress(options: {
    env: 'prod' | 'dev'
    messageDefaultFrom?: string
    channelFrom?: string
}): string {
    return (
        options.channelFrom ??
        options.messageDefaultFrom ??
        getDefaultFromAddress(options.env)
    )
}

export function getDefaultAssetBaseUrl(env: 'prod' | 'dev'): string {
    const bucket =
        env === 'prod' ? 'public-documents-vizo' : 'public-documents-vizo-dev'

    return `https://${bucket}.s3.eu-central-1.amazonaws.com`
}

export function formatSms(options: {
    body: string
    language: SupportedLanguage
}): string {
    const footerByLang: Record<SupportedLanguage, string> = {
        he: 'תודה, צוות SPARKLES',
        en: 'SPARKLES Team',
        de: 'SPARKLES Team',
        it: 'Team SPARKLES',
    }

    return [
        'SPARKLES',
        '',
        options.body.trim(),
        '',
        footerByLang[options.language],
    ].join('\n')
}

export function substituteParams(
    template: string,
    params: Record<string, string | number>,
): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
        const value = params[key]

        return value === undefined ? match : String(value)
    })
}
