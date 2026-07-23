import { WatiLocaleNotAvailableError } from '../src/errors'
import {
    buildWatiSendPayload,
    getWatiSpecFromPrebuilt,
    type PrebuiltWatiBundle,
} from '../src/wati-payload'

describe('wati-payload', () => {
    const bundle: PrebuiltWatiBundle = {
        id: 'product-journey.link',
        locales: {
            he: {
                elementName: 'application_online_process',
                paramKeys: ['name', 'vizoID'],
                referenceBody: 'Hello {{name}} {{vizoID}}',
                extractedAt: '2026-01-01T00:00:00.000Z',
            },
        },
    }

    it('getWatiSpecFromPrebuilt returns spec for locale', () => {
        const spec = getWatiSpecFromPrebuilt(bundle, 'he')
        expect(spec.elementName).toBe('application_online_process')
    })

    it('getWatiSpecFromPrebuilt throws when locale missing', () => {
        expect(() => getWatiSpecFromPrebuilt(bundle, 'en')).toThrow(
            WatiLocaleNotAvailableError,
        )
    })

    it('buildWatiSendPayload maps params to WATI v1 shape', () => {
        const spec = getWatiSpecFromPrebuilt(bundle, 'he')
        const payload = buildWatiSendPayload(spec, {
            name: 'Test User',
            vizoID: 'Vi-000001',
        })

        expect(payload).toEqual({
            template_name: 'application_online_process',
            broadcast_name: 'customer-notification',
            parameters: [
                { name: 'name', value: 'Test User' },
                { name: 'vizoID', value: 'Vi-000001' },
            ],
        })
    })

    it('buildWatiSendPayload throws when param missing', () => {
        const spec = getWatiSpecFromPrebuilt(bundle, 'he')
        expect(() =>
            buildWatiSendPayload(spec, { name: 'Test User' }),
        ).toThrow('Missing WATI parameter "vizoID"')
    })
})
