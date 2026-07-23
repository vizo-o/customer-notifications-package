export {
    SUPPORTED_LANGUAGES,
    type SupportedLanguage,
    type NotificationChannel,
    type EmailTheme,
    type RenderedEmail,
    type WatiLocaleSpec,
    type WatiLocaleMap,
    type RegisteredMessage,
    type CompileManifest,
    type CompileManifestEntry,
} from './types'

export {
    isSupportedLanguage,
    normalizeLanguagePreference,
    detectLanguageFromPhoneNumber,
    resolveLanguage,
    languageDirection,
} from './language'

export {
    getDefaultFromAddress,
    resolveFromAddress,
    getDefaultAssetBaseUrl,
    formatSms,
    substituteParams,
} from './sms'

export { defineMessage, parseMessageParams } from './define-message'

export { getWatiAvailableLocales, getWatiSpec, defineWatiChannel } from './wati'

export {
    WatiLocaleNotAvailableError,
    NotificationParamValidationError,
} from './errors'

export {
    SparklesEmailLayout,
    SparklesButton,
    SparklesCodeBox,
    SparklesCopyLink,
    SparklesHtmlOnlyText,
    SparklesLink,
} from './email/layout'
export type { SparklesEmailLayoutProps } from './email/layout'

export {
    renderEmail,
    renderSmsMessage,
    renderPrebuiltEmail,
    renderPrebuiltSms,
} from './render'
export type {
    PrebuiltEmailBundle,
    PrebuiltEmailLanguage,
    PrebuiltSmsBundle,
} from './render'

export {
    loadPrebuiltEmailBundle,
    loadPrebuiltSmsBundle,
    loadPrebuiltWatiBundle,
    resolveNotificationsPrebuiltDir,
} from './prebuilt-loader'

export {
    buildWatiSendPayload,
    getWatiSpecFromPrebuilt,
    type PrebuiltWatiBundle,
    type WatiSendPayload,
} from './wati-payload'

export { compileNotifications } from './compile'
export type { CompileOptions, CompileResult } from './compile'

export {
    COMPILE_STAMP_FILE,
    computeCompileInputsHash,
    getCompileStampPath,
    readCompileStamp,
    writeCompileStamp,
} from './compile-hash'
export type { CompileHashInputs, CompileStamp } from './compile-hash'
