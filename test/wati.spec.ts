import { z } from 'zod'
import { defineMessage } from '../src/define-message'
import { WatiLocaleNotAvailableError } from '../src/errors'
import type { RegisteredMessage } from '../src/types'
import {
    defineWatiChannel,
    getWatiAvailableLocales,
    getWatiSpec,
} from '../src/wati'

const testMessage = defineMessage({
    id: 'test.wati',
    paramsSchema: z.object({ link: z.string().url() }),
    channels: {
        wati: defineWatiChannel({
            he: {
                elementName: 'test__template',
                paramKeys: ['link'],
                referenceBody: 'sample',
                extractedAt: '2026-07-23T00:00:00.000Z',
            },
        }),
    },
}) as unknown as RegisteredMessage

describe('WATI locale helpers', () => {
    it('returns available locales', () => {
        expect(getWatiAvailableLocales(testMessage.channels.wati)).toEqual([
            'he',
        ])
        expect(getWatiAvailableLocales(undefined)).toEqual([])
    })

    it('returns spec for defined locale', () => {
        const spec = getWatiSpec(testMessage, 'he')
        expect(spec.elementName).toBe('test__template')
    })

    it('throws when WATI channel missing', () => {
        const noWati = defineMessage({
            id: 'test.no-wati',
            paramsSchema: z.object({}),
            channels: {},
        }) as unknown as RegisteredMessage

        expect(() => getWatiSpec(noWati, 'he')).toThrow(
            WatiLocaleNotAvailableError,
        )
    })

    it('throws when locale not defined', () => {
        expect(() => getWatiSpec(testMessage, 'en')).toThrow(
            WatiLocaleNotAvailableError,
        )
    })
})
