/** Outer shell used when the client renders dark mode (not transparent). */
export const SPARKLES_EMAIL_DARK_SHELL = '#111827'

/** Card surface in client dark mode (Outlook.com, Apple Mail, etc.). */
export const SPARKLES_EMAIL_DARK_CARD = '#1f2937'

const LIGHT_LOGO_HIDE = `
        display: none !important;
        max-height: 0 !important;
        overflow: hidden !important;
        mso-hide: all !important;
`

const LIGHT_LOGO_SHOW = `
        display: block !important;
        max-height: none !important;
        overflow: visible !important;
        margin-bottom: 16px !important;
`

const DARK_LOGO_SHOW = `
        ${LIGHT_LOGO_SHOW}
        height: 29px !important;
        width: auto !important;
`

/**
 * Outlook.com prefixes class names in HTML/CSS with x_ (e.g. x_email-card).
 * Use [class*="email-*"] substring selectors so dark-mode rules still match.
 * For bgcolor hooks use E[attr] selectors (table[data-ogab="#ffffff"]).
 *
 * Logo visibility: hidden variant uses inline display:none (Outlook ignores
 * head CSS on img tags). Dark-mode CSS with !important swaps which logo shows.
 */
export const SPARKLES_EMAIL_DARK_MODE_STYLES = `
    :root {
        color-scheme: light dark;
        supported-color-schemes: light dark;
    }

    .email-logo-light,
    [class*="email-logo-light"],
    img[class*="email-logo-light"] {
        ${LIGHT_LOGO_SHOW}
    }
    .email-logo-dark,
    [class*="email-logo-dark"],
    img[class*="email-logo-dark"] {
        ${LIGHT_LOGO_HIDE}
    }

    @media (prefers-color-scheme: dark) {
        .email-bg,
        [class*="email-bg"] {
            background-color: ${SPARKLES_EMAIL_DARK_SHELL} !important;
        }
        .email-card,
        [class*="email-card"],
        table[class*="email-card"] {
            background-color: ${SPARKLES_EMAIL_DARK_CARD} !important;
            border-color: #374151 !important;
        }
        .email-text,
        [class*="email-text"],
        .email-text *,
        [class*="email-text"] *,
        [class*="email-text"] p {
            color: #f9fafb !important;
        }
        .email-muted,
        [class*="email-muted"],
        p[class*="email-muted"] {
            color: #d1d5db !important;
        }
        .email-link,
        [class*="email-link"],
        .email-text a,
        [class*="email-text"] a {
            color: #60a5fa !important;
        }
        .email-logo-light,
        [class*="email-logo-light"],
        img[class*="email-logo-light"] {
            ${LIGHT_LOGO_HIDE}
        }
        .email-logo-dark,
        [class*="email-logo-dark"],
        img[class*="email-logo-dark"] {
            ${DARK_LOGO_SHOW}
        }
        .email-button,
        [class*="email-button"] {
            background-color: #0066cc !important;
            color: #ffffff !important;
        }
        .email-code-box,
        [class*="email-code-box"],
        p[class*="email-code-box"] {
            background-color: #374151 !important;
            color: #f9fafb !important;
            border-color: #4b5563 !important;
        }
    }

    /* Outlook.com / new Outlook: data-og* on ancestor OR E[attr] on element */
    [data-ogsb] [class*="email-bg"],
    div[data-ogsb][class*="email-bg"] {
        background-color: ${SPARKLES_EMAIL_DARK_SHELL} !important;
    }
    [data-ogsb] [class*="email-card"],
    [data-ogsb] table[class*="email-card"],
    table[data-ogab="#ffffff"],
    table[data-ogab="#FFFFFF"],
    table[data-ogsb][class*="email-card"] {
        background-color: ${SPARKLES_EMAIL_DARK_CARD} !important;
        border-color: #374151 !important;
    }
    [data-ogsc] [class*="email-text"],
    [data-ogsc] [class*="email-text"] p,
    [data-ogsc] [class*="email-text"] div,
    [data-ogsc] p[class*="email-text"],
    div[data-ogsc][class*="email-text"],
    [data-ogsb] [class*="email-text"],
    [data-ogsb] [class*="email-text"] p,
    [data-ogsb] [class*="email-text"] div {
        color: #f9fafb !important;
    }
    [data-ogsc] [class*="email-muted"],
    [data-ogsc] p[class*="email-muted"],
    [data-ogsb] [class*="email-muted"],
    [data-ogsb] p[class*="email-muted"] {
        color: #d1d5db !important;
    }
    [data-ogsc] [class*="email-link"],
    [data-ogsc] [class*="email-text"] a,
    [data-ogsb] [class*="email-link"],
    [data-ogsb] [class*="email-text"] a {
        color: #60a5fa !important;
    }
    [data-ogsb] [class*="email-logo-light"],
    [data-ogsb] img[class*="email-logo-light"] {
        ${LIGHT_LOGO_HIDE}
    }
    [data-ogsb] [class*="email-logo-dark"],
    [data-ogsb] img[class*="email-logo-dark"] {
        ${DARK_LOGO_SHOW}
    }
    [data-ogsb] [class*="email-button"] {
        background-color: #0066cc !important;
    }
    [data-ogsc] [class*="email-button"],
    [data-ogsb] [class*="email-button"] {
        color: #ffffff !important;
    }
    [data-ogsb] [class*="email-code-box"],
    p[data-ogsb][class*="email-code-box"] {
        background-color: #374151 !important;
        border-color: #4b5563 !important;
        color: #f9fafb !important;
    }
    [data-ogsc] [class*="email-code-box"],
    [data-ogsc] p[class*="email-code-box"],
    [data-ogsb] p[class*="email-code-box"] {
        color: #f9fafb !important;
    }
`
