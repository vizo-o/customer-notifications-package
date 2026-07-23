import type { z } from 'zod'
import type { RegisteredMessage } from './types'

export function defineMessage<
    TParams extends Record<string, unknown>,
    TVariant extends string = never,
>(
    definition: RegisteredMessage<TParams, TVariant>,
): RegisteredMessage<TParams, TVariant> {
    if (definition.channels.email) {
        for (const lang of ['he', 'en', 'de', 'it'] as const) {
            if (!definition.channels.email.subjects[lang]) {
                throw new Error(
                    `Message "${definition.id}" email subject missing for language "${lang}"`,
                )
            }
        }
    }

    if (definition.channels.sms) {
        const bodies =
            typeof definition.channels.sms.bodies === 'function'
                ? null
                : definition.channels.sms.bodies

        if (bodies) {
            for (const lang of ['he', 'en', 'de', 'it'] as const) {
                if (!bodies[lang]) {
                    throw new Error(
                        `Message "${definition.id}" SMS body missing for language "${lang}"`,
                    )
                }
            }
        }
    }

    if (definition.channels.wati) {
        const locales = Object.keys(definition.channels.wati)
        if (locales.length === 0) {
            throw new Error(
                `Message "${definition.id}" WATI channel must define at least one locale`,
            )
        }
    }

    return definition
}

export function parseMessageParams<TParams extends Record<string, unknown>>(
    message: RegisteredMessage<TParams>,
    params: unknown,
): TParams {
    const result = (message.paramsSchema as z.ZodType<TParams>).safeParse(
        params,
    )
    if (!result.success) {
        throw new Error(result.error.message)
    }

    return result.data
}
