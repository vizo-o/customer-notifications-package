export const INVISIBLE_EMAIL_CHARS = /[\u200B-\u200F\uFEFF\u2060\u00AD]/g

export function sanitizeHtmlEmailBody(html: string): string {
    return html
        .replace(/\0/g, '')
        .replace(INVISIBLE_EMAIL_CHARS, '')
        .replace(/\u00A0/g, ' ')
}

export function sanitizePlainTextEmailBody(text: string): string {
    const cleaned = sanitizeHtmlEmailBody(text)

    const paragraphs = cleaned
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)

    if (paragraphs.length >= 3 && paragraphs[0] === paragraphs[2]) {
        paragraphs.shift()
    } else if (paragraphs.length >= 2 && paragraphs[0] === paragraphs[1]) {
        paragraphs.shift()
    }

    return `${paragraphs.join('\n\n')}\n`
}
