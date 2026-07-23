import {
    Body,
    Container,
    Head,
    Html,
    Preview,
    Section,
    Text,
} from '@react-email/components'
import type {
    ComponentProps,
    CSSProperties,
    ImgHTMLAttributes,
    ReactNode,
} from 'react'
import type { EmailTheme, SupportedLanguage } from '../types'
import { languageDirection } from '../language'
import {
    SPARKLES_EMAIL_DARK_MODE_STYLES,
    SPARKLES_EMAIL_DARK_SHELL,
} from './dark-mode-styles'

export interface SparklesEmailLayoutProps {
    language: SupportedLanguage
    theme: EmailTheme
    assetBaseUrl: string
    previewText?: string
    children: ReactNode
}

const LIGHT_SHELL_BACKGROUND = '#f6f7f9'
const LIGHT_CARD_BACKGROUND = '#ffffff'
const DARK_CARD_BACKGROUND = '#1f2937'
const LIGHT_TEXT = '#1a1a1a'
const DARK_TEXT = '#f9fafb'
const LIGHT_MUTED = '#4b5563'
const DARK_MUTED = '#d1d5db'
const LIGHT_BORDER = '#e5e7eb'
const DARK_BORDER = '#374151'

type OutlookStyle = CSSProperties & { msoHide?: string }

function logoUrl(assetBaseUrl: string, theme: EmailTheme): string {
    const file = theme === 'dark' ? 'logo-dark.png' : 'logo-light.png'

    return `${assetBaseUrl.replace(/\/$/, '')}/brand/${file}`
}

const SPARKLES_LOGO_WIDTH = 189
const SPARKLES_LOGO_HEIGHT = 29

const logoDimensionStyle = (): OutlookStyle => ({
    width: `${SPARKLES_LOGO_WIDTH}px`,
    height: `${SPARKLES_LOGO_HEIGHT}px`,
    maxWidth: `${SPARKLES_LOGO_WIDTH}px`,
})

function hiddenLogoStyle(): OutlookStyle {
    return {
        display: 'none',
        maxHeight: 0,
        overflow: 'hidden',
        marginBottom: 0,
        width: 0,
        height: 0,
        maxWidth: 0,
        msoHide: 'all',
    }
}

function visibleLogoStyle(): OutlookStyle {
    return {
        display: 'block',
        marginBottom: '16px',
        ...logoDimensionStyle(),
    }
}

function logoImgStyle(
    variant: 'light' | 'dark',
    theme: EmailTheme,
): OutlookStyle {
    const isVisible =
        (theme === 'light' && variant === 'light') ||
        (theme === 'dark' && variant === 'dark')

    return isVisible ? visibleLogoStyle() : hiddenLogoStyle()
}

function logoImgDimensions(
    variant: 'light' | 'dark',
    theme: EmailTheme,
): { width: number; height: number } {
    const isVisible =
        (theme === 'light' && variant === 'light') ||
        (theme === 'dark' && variant === 'dark')

    return isVisible
        ? {
              width: SPARKLES_LOGO_WIDTH,
              height: SPARKLES_LOGO_HEIGHT,
          }
        : { width: 0, height: 0 }
}

function SparklesLogoImg(props: {
    className: string
    src: string
    width: number
    height: number
    style: OutlookStyle
}) {
    const imgProps = {
        className: props.className,
        src: props.src,
        alt: 'SPARKLES',
        width: props.width,
        height: props.height,
        norescale: 'norescale',
        style: {
            display: 'block',
            outline: 'none',
            border: 'none',
            textDecoration: 'none',
            ...props.style,
        },
    } as ImgHTMLAttributes<HTMLImageElement>

    return <img {...imgProps} />
}

function SparklesLogoSection(props: {
    assetBaseUrl: string
    theme: EmailTheme
}) {
    const lightSrc = logoUrl(props.assetBaseUrl, 'light')
    const darkSrc = logoUrl(props.assetBaseUrl, 'dark')

    const lightDimensions = logoImgDimensions('light', props.theme)
    const darkDimensions = logoImgDimensions('dark', props.theme)
    const msoLogo = `<!--[if mso]><img src="${lightSrc}" alt="SPARKLES" width="${SPARKLES_LOGO_WIDTH}" height="${SPARKLES_LOGO_HEIGHT}" norescale="norescale" style="display:block;width:${SPARKLES_LOGO_WIDTH}px;height:${SPARKLES_LOGO_HEIGHT}px;max-width:${SPARKLES_LOGO_WIDTH}px;margin-bottom:16px;" /><![endif]-->`

    return (
        <table
            role='presentation'
            cellPadding={0}
            cellSpacing={0}
            border={0}
            width={SPARKLES_LOGO_WIDTH}
            style={{
                width: `${SPARKLES_LOGO_WIDTH}px`,
                maxWidth: `${SPARKLES_LOGO_WIDTH}px`,
            }}
        >
            <tbody>
                <tr>
                    <td
                        width={SPARKLES_LOGO_WIDTH}
                        style={{
                            width: `${SPARKLES_LOGO_WIDTH}px`,
                            maxWidth: `${SPARKLES_LOGO_WIDTH}px`,
                            lineHeight: `${SPARKLES_LOGO_HEIGHT}px`,
                            fontSize: 0,
                        }}
                    >
                        <div dangerouslySetInnerHTML={{ __html: msoLogo }} />
                        <div
                            dangerouslySetInnerHTML={{
                                __html: '<!--[if !mso]><!-- -->',
                            }}
                        />
                        <SparklesLogoImg
                            className='email-logo-light'
                            src={lightSrc}
                            width={lightDimensions.width}
                            height={lightDimensions.height}
                            style={logoImgStyle('light', props.theme)}
                        />
                        <SparklesLogoImg
                            className='email-logo-dark'
                            src={darkSrc}
                            width={darkDimensions.width}
                            height={darkDimensions.height}
                            style={logoImgStyle('dark', props.theme)}
                        />
                        <div
                            dangerouslySetInnerHTML={{
                                __html: '<!--<![endif]-->',
                            }}
                        />
                    </td>
                </tr>
            </tbody>
        </table>
    )
}

export function SparklesEmailLayout({
    language,
    theme,
    assetBaseUrl,
    previewText,
    children,
}: SparklesEmailLayoutProps) {
    const dir = languageDirection(language)
    const isDark = theme === 'dark'
    const shellBackground = isDark
        ? SPARKLES_EMAIL_DARK_SHELL
        : LIGHT_SHELL_BACKGROUND
    const cardBackground = isDark ? DARK_CARD_BACKGROUND : LIGHT_CARD_BACKGROUND
    const textColor = isDark ? DARK_TEXT : LIGHT_TEXT
    const mutedColor = isDark ? DARK_MUTED : LIGHT_MUTED
    const borderColor = isDark ? DARK_BORDER : LIGHT_BORDER

    return (
        <Html dir={dir} lang={language}>
            <Head>
                <meta name='color-scheme' content='light dark' />
                <meta name='supported-color-schemes' content='light dark' />
                <style>{SPARKLES_EMAIL_DARK_MODE_STYLES}</style>
            </Head>
            {previewText ? <Preview>{previewText}</Preview> : null}
            <Body
                className='email-bg'
                style={{
                    margin: 0,
                    padding: '24px',
                    backgroundColor: shellBackground,
                    color: textColor,
                    colorScheme: 'light dark',
                    fontFamily: 'Arial, Helvetica, sans-serif',
                }}
            >
                <Container
                    className='email-card'
                    bgcolor={isDark ? cardBackground : LIGHT_CARD_BACKGROUND}
                    style={{
                        maxWidth: '560px',
                        margin: '0 auto',
                        backgroundColor: cardBackground,
                        borderRadius: '8px',
                        border: `1px solid ${borderColor}`,
                        overflow: 'hidden',
                    }}
                >
                    <Section style={{ padding: '24px 24px 8px 24px' }}>
                        <SparklesLogoSection
                            assetBaseUrl={assetBaseUrl}
                            theme={theme}
                        />
                    </Section>
                    <Section
                        className='email-body-section'
                        style={{
                            padding: '0 24px 28px 24px',
                            color: textColor,
                            direction: dir,
                            textAlign: dir === 'rtl' ? 'right' : 'left',
                        }}
                    >
                        <div
                            className='email-text'
                            style={{
                                direction: dir,
                                textAlign: dir === 'rtl' ? 'right' : 'left',
                                color: textColor,
                                fontSize: '16px',
                                lineHeight: '1.55',
                            }}
                        >
                            {children}
                        </div>
                        <Text
                            className='email-muted'
                            style={{
                                marginTop: '24px',
                                fontSize: '14px',
                                lineHeight: '1.5',
                                color: mutedColor,
                                direction: dir,
                                textAlign: dir === 'rtl' ? 'right' : 'left',
                            }}
                        >
                            SPARKLES
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    )
}

export function SparklesButton(props: {
    href: string
    label: string
    language: SupportedLanguage
}) {
    return (
        <a
            href={props.href}
            className='email-button'
            data-skip-in-text={true}
            style={{
                display: 'inline-block',
                padding: '12px 22px',
                backgroundColor: '#0066cc',
                color: '#ffffff',
                textDecoration: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                fontWeight: 600,
                margin: '12px 0',
            }}
        >
            {props.label}
        </a>
    )
}

export function SparklesLink(props: { href: string; children: ReactNode }) {
    return (
        <a
            href={props.href}
            className='email-link'
            style={{
                color: '#0066cc',
                textDecoration: 'underline',
            }}
        >
            {props.children}
        </a>
    )
}

const copyLinkFallbackHints: Record<SupportedLanguage, string> = {
    he: 'העתק את הכתובת הבאה והדבק אותה בדפדפן כדי לאשר את ההסכמה:',
    en: 'Copy this address and paste it in your browser to approve:',
    de: 'Kopieren Sie diese Adresse und fügen Sie sie in Ihren Browser ein, um zuzustimmen:',
    it: 'Copia questo indirizzo e incollalo nel browser per approvare:',
}

export function SparklesHtmlOnlyText(props: ComponentProps<typeof Text>) {
    return <Text {...props} data-skip-in-text={true} />
}

export function SparklesCopyLink(props: {
    url: string
    language: SupportedLanguage
}) {
    const dir = languageDirection(props.language)
    const hint = copyLinkFallbackHints[props.language]

    return (
        <>
            <Text
                className='email-muted email-copy-hint'
                style={{
                    margin: '16px 0 8px 0',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    color: LIGHT_MUTED,
                    textAlign: 'center',
                    direction: dir,
                }}
            >
                {hint}
            </Text>
            <Text
                className='email-link email-copy-url'
                style={{
                    margin: '0 0 4px 0',
                    wordBreak: 'break-all',
                    fontSize: '11px',
                    lineHeight: '1.4',
                    color: '#0066cc',
                    textAlign: 'center',
                    direction: dir,
                }}
            >
                <a
                    href={props.url}
                    className='email-link'
                    style={{
                        color: '#0066cc',
                        textDecoration: 'none',
                        fontSize: '11px',
                        lineHeight: '1.4',
                    }}
                >
                    {props.url}
                </a>
            </Text>
        </>
    )
}

export function SparklesCodeBox(props: { code: string }) {
    return (
        <Text
            className='email-code-box'
            style={{
                display: 'inline-block',
                backgroundColor: '#f5f5f5',
                color: '#333333',
                padding: '14px 24px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontWeight: 700,
                fontSize: '24px',
                letterSpacing: '4px',
                border: '1px solid #dddddd',
                textAlign: 'center',
            }}
        >
            {props.code}
        </Text>
    )
}
