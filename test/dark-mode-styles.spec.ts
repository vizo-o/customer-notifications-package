import { SPARKLES_EMAIL_DARK_MODE_STYLES } from '../src/email/dark-mode-styles'

describe('Sparkles email dark mode styles', () => {
    it('uses a solid dark shell instead of transparent', () => {
        expect(SPARKLES_EMAIL_DARK_MODE_STYLES).toContain(
            'background-color: #111827 !important',
        )
        expect(SPARKLES_EMAIL_DARK_MODE_STYLES).not.toContain('transparent')
    })

    it('targets Outlook.com x_-prefixed classes via substring selectors', () => {
        expect(SPARKLES_EMAIL_DARK_MODE_STYLES).toContain(
            '[class*="email-card"]',
        )
        expect(SPARKLES_EMAIL_DARK_MODE_STYLES).toContain(
            '[data-ogsb] table[class*="email-card"]',
        )
        expect(SPARKLES_EMAIL_DARK_MODE_STYLES).toContain(
            'table[data-ogab="#ffffff"]',
        )
    })

    it('uses descendant data-og selectors for Outlook.com', () => {
        expect(SPARKLES_EMAIL_DARK_MODE_STYLES).toContain(
            '[data-ogsb] [class*="email-bg"]',
        )
        expect(SPARKLES_EMAIL_DARK_MODE_STYLES).toContain(
            '[data-ogsc] [class*="email-text"]',
        )
        expect(SPARKLES_EMAIL_DARK_MODE_STYLES).toContain(
            '[data-ogsc] [class*="email-muted"]',
        )
    })

    it('does not use class+data-og compound selectors unsupported by Outlook.com', () => {
        expect(SPARKLES_EMAIL_DARK_MODE_STYLES).not.toMatch(
            /\[data-og(?:sc|sb|ac|ab)\]\./,
        )
        expect(SPARKLES_EMAIL_DARK_MODE_STYLES).not.toMatch(
            /\.email-(?:bg|card|text|muted|link|button|code-box)\[data-og/,
        )
    })

    it('hides the light logo in dark mode with mso-hide for Outlook', () => {
        expect(SPARKLES_EMAIL_DARK_MODE_STYLES).toContain('mso-hide: all')
        expect(SPARKLES_EMAIL_DARK_MODE_STYLES).toContain(
            '[data-ogsb] img[class*="email-logo-light"]',
        )
        expect(SPARKLES_EMAIL_DARK_MODE_STYLES).toContain(
            '[data-ogsb] img[class*="email-logo-dark"]',
        )
    })

    it('defaults light HTML logos with inline hide on the inactive variant', () => {
        expect(SPARKLES_EMAIL_DARK_MODE_STYLES).toContain(
            'img[class*="email-logo-light"]',
        )
        expect(SPARKLES_EMAIL_DARK_MODE_STYLES).toContain(
            'img[class*="email-logo-dark"]',
        )
    })

    it('targets React Email p tags for Outlook text and code box fixes', () => {
        expect(SPARKLES_EMAIL_DARK_MODE_STYLES).toContain(
            '[data-ogsc] [class*="email-text"] p',
        )
        expect(SPARKLES_EMAIL_DARK_MODE_STYLES).toContain(
            'p[data-ogsb][class*="email-code-box"]',
        )
        expect(SPARKLES_EMAIL_DARK_MODE_STYLES).toContain(
            '[data-ogsb] p[class*="email-muted"]',
        )
    })
})
