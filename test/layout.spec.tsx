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
        expect(html).toMatch(/email-logo-light[^>]*width="189"/i)
        expect(html).toMatch(/email-logo-light[^>]*height="29"/i)
        expect(html).toContain('norescale="norescale"')
        expect(html).toContain('width="189"')
        expect(html).toMatch(/width:189px/)
        expect(html).toMatch(/height:29px/)
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

        expect(html).toContain(
            '???? ?? ?????? ???? ????? ???? ?????? ??? ???? ?? ??????:',
        )
        expect(html).toContain('https://example.com/approve')
        expect(html).toContain('class="email-copy-url"')
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
