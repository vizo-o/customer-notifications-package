import {
    sanitizeHtmlEmailBody,
    sanitizePlainTextEmailBody,
} from '../src/email-sanitize'

describe('email sanitization', () => {
    it('removes invisible characters from html preheader output', () => {
        const html =
            'Your verification code is:<div>\xa0\u200c\u200b\u200d\u200e\u200f\ufeff</div>'

        expect(sanitizeHtmlEmailBody(html)).toBe(
            'Your verification code is:<div> </div>',
        )
    })

    it('removes react-email preheader padding and duplicate preview line', () => {
        const raw = [
            'Your verification code is:',
            '\u00a0\u200c \u200d\u200e\u200f\ufeff'.repeat(20),
            '',
            'Hello, this is SPARKLES \uD83D\uDE0E',
            '',
            'Your verification code is:',
            '',
            '123456',
            '',
            'Thank you \u2728',
            '',
            'SPARKLES',
        ].join('\n')

        expect(sanitizePlainTextEmailBody(raw)).toBe(
            [
                'Hello, this is SPARKLES \uD83D\uDE0E',
                '',
                'Your verification code is:',
                '',
                '123456',
                '',
                'Thank you \u2728',
                '',
                'SPARKLES',
                '',
            ].join('\n'),
        )
    })

    it('preserves copy-link fallback instructions in Hebrew', () => {
        const greeting =
            '\u05d4\u05d9, \u05e0\u05e2\u05d9\u05dd \u05d4\u05db\u05d9\u05e8 \u05db\u05d0\u05df SPARKLES \uD83D\uDE0E'
        const hint =
            '\u05d4\u05e2\u05ea\u05e7 \u05d0\u05ea \u05d4\u05db\u05ea\u05d5\u05d1\u05ea \u05d4\u05d1\u05d0\u05d4 \u05d5\u05d4\u05d3\u05d1\u05e7 \u05d0\u05d5\u05ea\u05d4 \u05d1\u05d3\u05e4\u05d3\u05e4\u05df \u05db\u05d3\u05d9 \u05dc\u05d0\u05e9\u05e8 \u05d0\u05ea \u05d4\u05d4\u05e1\u05db\u05de\u05d4:'
        const raw = [
            greeting,
            '',
            hint,
            '',
            'https://example.com/approve',
            '',
            'SPARKLES',
        ].join('\n')

        expect(sanitizePlainTextEmailBody(raw)).toBe(`${raw}\n`)
    })
})
