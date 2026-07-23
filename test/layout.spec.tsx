import { render } from '@react-email/render'
import {
    SparklesButton,
    SparklesCopyLink,
    SparklesEmailLayout,
} from '../src/email/layout'

describe('SparklesEmailLayout', () => {
    it('includes color-scheme meta tags and inline colors for Outlook hooks', async () => {
        const html = await render(
            <SparklesEmailLayout
                language='he'
                theme='light'
                assetBaseUrl='https://assets.example.com'
            >
                <p>Hello</p>
            </SparklesEmailLayout>,
        )

        expect(html).toContain('name="color-scheme" content="light dark"')
        expect(html).toContain(
            'name="supported-color-schemes" content="light dark"',
        )
        expect(html).toContain('background-color:#f6f7f9')
        expect(html).toContain('bgcolor="#ffffff"')
        expect(html).toContain('<!--[if mso]>')
        expect(html).toContain('<!--[if !mso]><!-- -->')
        expect(html).toContain('class="email-logo-light"')
        expect(html).toContain('class="email-logo-dark"')
        expect(html).toContain('img[class*="email-logo-light"]')
        expect(html).toMatch(/email-logo-dark[^>]*display:none/i)
        expect(html).toMatch(/email-logo-light[^>]*height="29"/i)
    })

    it('renders inbox preview text without invisible preheader padding', async () => {
        const html = await render(
            <SparklesEmailLayout
                language='en'
                theme='light'
                assetBaseUrl='https://assets.example.com'
                previewText='Your verification code is:'
            >
                <p>Hello</p>
            </SparklesEmailLayout>,
        )

        expect(html).toContain('Your verification code is:')
        expect(html).not.toMatch(/[\u200B-\u200F\uFEFF]/)
    })

    it('uses a solid dark shell for the dark theme variant', async () => {
        const html = await render(
            <SparklesEmailLayout
                language='en'
                theme='dark'
                assetBaseUrl='https://assets.example.com'
            >
                <p>Hello</p>
            </SparklesEmailLayout>,
        )

        expect(html).toContain('background-color:#111827')
        expect(html).toContain('bgcolor="#1f2937"')
        expect(html).not.toContain('transparent')
    })

    it('renders translated copy fallback hint and compact URL', async () => {
        const heCopyHint =
            '\u05d4\u05e2\u05ea\u05e7 \u05d0\u05ea \u05d4\u05db\u05ea\u05d5\u05d1\u05ea \u05d4\u05d1\u05d0\u05d4 \u05d5\u05d4\u05d3\u05d1\u05e7 \u05d0\u05d5\u05ea\u05d4 \u05d1\u05d3\u05e4\u05d3\u05e4\u05df \u05db\u05d3\u05d9 \u05dc\u05d0\u05e9\u05e8 \u05d0\u05ea \u05d4\u05d4\u05e1\u05db\u05de\u05d4:'
        const html = await render(
            <SparklesEmailLayout
                language='he'
                theme='light'
                assetBaseUrl='https://assets.example.com'
            >
                <SparklesCopyLink
                    url='https://example.com/approve'
                    language='he'
                />
            </SparklesEmailLayout>,
        )

        expect(html).toContain(heCopyHint)
        expect(html).toContain('email-copy-hint')
        expect(html).toContain('https://example.com/approve')
        expect(html).toContain('email-copy-url')
        expect(html).not.toContain('email-copy-btn')
        expect(html).not.toContain('data-sparkles-copy-url')
    })

    it('omits html-only button copy from plain text fallback', async () => {
        const text = await render(
            <SparklesEmailLayout
                language='en'
                theme='light'
                assetBaseUrl='https://assets.example.com'
            >
                <SparklesButton
                    href='https://example.com/approve'
                    label='Click here to approve'
                    language='en'
                />
                <SparklesCopyLink
                    url='https://example.com/approve'
                    language='en'
                />
            </SparklesEmailLayout>,
            { plainText: true },
        )

        expect(text).toContain(
            'Copy this address and paste it in your browser to approve:',
        )
        expect(text).toContain('https://example.com/approve')
        expect(text).not.toContain('Click here to approve')
    })
})
