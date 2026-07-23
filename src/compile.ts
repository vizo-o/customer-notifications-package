import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { zodToJsonSchema } from 'zod-to-json-schema'
import type {
    CompileManifest,
    CompileManifestEntry,
    RegisteredMessage,
    SupportedLanguage,
    WatiLocaleMap,
} from './types'
import { getDefaultAssetBaseUrl } from './sms'
import { renderEmail, renderSmsMessage } from './render'
import { getWatiAvailableLocales } from './wati'
import { SUPPORTED_LANGUAGES } from './types'
import {
    computeCompileInputsHash,
    getCompileStampPath,
    writeCompileStamp,
    type CompileStamp,
} from './compile-hash'

export interface CompileOptions {
    repoRoot: string
    repoName: string
    messages: RegisteredMessage[]
    env?: 'prod' | 'dev'
    previewDir?: string
    prebuiltOutputs?: Array<{
        messageId: string
        outputPath: string
        smsOutputPath?: string
    }>
    prebuildAllEmail?: boolean
    prebuiltDir?: string
    sampleParams?: Record<string, Record<string, unknown>>
    variants?: Record<string, string[]>
    includePreview?: boolean
    skipPrebuilt?: boolean
    frameworkRoot?: string
    frameworkVersion?: string
}

export interface CompileResult {
    manifestPath?: string
    manifest?: CompileManifest
    skipped?: boolean
    stamp?: CompileStamp
}

const SAMPLE_DEFAULTS: Record<string, Record<string, unknown>> = {
    'auth.otp': { code: '123456' },
    'impersonation.approval-request': {
        approvalLink:
            'https://portal.sparkles-adhd.com/impersonation/sample-token',
        expiryMinutes: 15,
    },
    'asrs.portal-link': {
        signInUrl: 'https://portal.sparkles-adhd.com/he/sign-in?asrs=sample',
    },
    'data-sharing.approval-request': {
        approvalLink:
            'https://affiliate.sparkles-adhd.com/dataSharingEmailApproval/sample-token',
        agreementUrl: 'https://www.sparkles-adhd.com/info-sharing-agreement',
    },
    'product-journey.link': {
        customerName: 'Sample Customer',
        vizoId: 'Vi-000001',
        portalUrl: 'https://md.sparkles-adhd.com/sign-in/Vi-000001',
    },
    'product-journey.link.external-optics': {
        customerName: 'Sample Customer',
        vizoId: 'Vi-000001',
        portalUrl: 'https://md.sparkles-adhd.com/dashboard',
    },
}

function injectPlaceholders(
    text: string,
    sampleParams: Record<string, unknown>,
): string {
    let result = text
    for (const [key, value] of Object.entries(sampleParams)) {
        if (value === undefined || value === null) {
            continue
        }
        result = result.split(String(value)).join(`{{${key}}}`)
    }

    return result
}

function resolveDefaultFrameworkRoot(repoRoot: string): string {
    const requireFromCompile = createRequire(__filename)

    try {
        return path.dirname(
            requireFromCompile.resolve(
                '@vizo-o/customer-notifications/package.json',
            ),
        )
    } catch {
        return path.join(repoRoot, '../../customer-notifications-package')
    }
}

export async function compileNotifications(
    options: CompileOptions,
): Promise<CompileResult> {
    const env = options.env ?? 'dev'
    const assetBaseUrl = getDefaultAssetBaseUrl(env)
    const includePreview = options.includePreview ?? false
    const skipPrebuilt = options.skipPrebuilt ?? false
    const previewDir =
        options.previewDir ??
        path.join(options.repoRoot, '.notifications-preview')
    const bundlesDir = path.join(previewDir, 'bundles')

    if (includePreview) {
        await fs.rm(previewDir, { recursive: true, force: true })
        await fs.mkdir(bundlesDir, { recursive: true })
    }

    const manifestEntries: CompileManifestEntry[] = []

    for (const message of options.messages) {
        const variantList =
            options.variants?.[message.id] ??
            (message.variants?.length ? [...message.variants] : ['default'])

        const previewPaths: Record<string, string> = {}
        const resolveWatiLocales = (variant: string): WatiLocaleMap | undefined => {
            const wati = message.channels.wati
            if (!wati) {
                return undefined
            }

            if (typeof wati === 'function') {
                return wati(
                    variant !== 'default' ? (variant as never) : undefined,
                )
            }

            return wati
        }
        const watiAvailableLocales = getWatiAvailableLocales(
            resolveWatiLocales(variantList[0] ?? 'default'),
        )
        const prebuiltTarget = options.prebuiltOutputs?.find(
            (entry) => entry.messageId === message.id,
        )

        for (const variant of variantList) {
            const baseSampleParams =
                options.sampleParams?.[message.id] ??
                SAMPLE_DEFAULTS[message.id] ??
                {}
            const sampleParams =
                variant !== 'default'
                    ? {
                          ...baseSampleParams,
                          variant,
                          ...(variant === 'externalOptics' &&
                          'agreementUrl' in baseSampleParams
                              ? {
                                    agreementUrl:
                                        'https://www.sparkles-adhd.com/info-sharing-agreement-optics',
                                }
                              : {}),
                      }
                    : baseSampleParams

            if (includePreview && message.channels.email) {
                for (const language of SUPPORTED_LANGUAGES) {
                    for (const theme of ['light', 'dark'] as const) {
                        const rendered = await renderEmail({
                            message,
                            language,
                            params: sampleParams,
                            theme,
                            assetBaseUrl,
                            env,
                            variant:
                                variant === 'default' ? undefined : variant,
                        })

                        const relPath = path.join(
                            'bundles',
                            message.id,
                            variant,
                            language,
                            `email-${theme}.html`,
                        )
                        const absPath = path.join(previewDir, relPath)
                        await fs.mkdir(path.dirname(absPath), {
                            recursive: true,
                        })
                        await fs.writeFile(absPath, rendered.htmlBody, 'utf8')
                        previewPaths[`${variant}:${language}:email:${theme}`] =
                            relPath

                        if (theme === 'light') {
                            const textRel = path.join(
                                'bundles',
                                message.id,
                                variant,
                                language,
                                'email.txt',
                            )
                            await fs.writeFile(
                                path.join(previewDir, textRel),
                                rendered.textBody,
                                'utf8',
                            )
                            previewPaths[`${variant}:${language}:email:text`] =
                                textRel

                            const subjectRel = path.join(
                                'bundles',
                                message.id,
                                variant,
                                language,
                                'email-subject.txt',
                            )
                            await fs.writeFile(
                                path.join(previewDir, subjectRel),
                                rendered.subject,
                                'utf8',
                            )
                            previewPaths[
                                `${variant}:${language}:email:subject`
                            ] = subjectRel
                        }
                    }
                }
            }

            if (includePreview && message.channels.sms) {
                for (const language of SUPPORTED_LANGUAGES) {
                    const smsBody = renderSmsMessage({
                        message,
                        language,
                        params: sampleParams,
                        variant: variant === 'default' ? undefined : variant,
                    })
                    const relPath = path.join(
                        'bundles',
                        message.id,
                        variant,
                        language,
                        'sms.txt',
                    )
                    const smsAbsPath = path.join(previewDir, relPath)
                    await fs.mkdir(path.dirname(smsAbsPath), {
                        recursive: true,
                    })
                    await fs.writeFile(smsAbsPath, smsBody, 'utf8')
                    previewPaths[`${variant}:${language}:sms`] = relPath
                }
            }

            if (includePreview && message.channels.wati) {
                const watiLocales = resolveWatiLocales(variant)
                if (!watiLocales) {
                    continue
                }

                for (const locale of getWatiAvailableLocales(watiLocales)) {
                    const spec = watiLocales[locale]
                    if (!spec) {
                        continue
                    }

                    const relPath = path.join(
                        'bundles',
                        message.id,
                        variant,
                        'wati',
                        `${locale}.json`,
                    )
                    await fs.mkdir(
                        path.dirname(path.join(previewDir, relPath)),
                        { recursive: true },
                    )
                    await fs.writeFile(
                        path.join(previewDir, relPath),
                        JSON.stringify(spec, null, 2),
                        'utf8',
                    )
                    previewPaths[`${variant}:wati:${locale}`] = relPath
                }
            }
        }

        if (includePreview) {
            manifestEntries.push({
                id: message.id,
                variants: variantList,
                paramsJsonSchema: zodToJsonSchema(
                    message.paramsSchema as never,
                ) as Record<string, unknown>,
                emailLanguages: message.channels.email
                    ? [...SUPPORTED_LANGUAGES]
                    : [],
                smsLanguages: message.channels.sms
                    ? [...SUPPORTED_LANGUAGES]
                    : [],
                watiAvailableLocales,
                previewPaths,
            })
        }

        if (!skipPrebuilt && message.channels.sms) {
            const prebuiltDir =
                options.prebuiltDir ??
                path.join(options.repoRoot, 'notifications/prebuilt')

            const writeSmsPrebuilt = async (
                variant: string,
                sampleParams: Record<string, unknown>,
                customOutputPath?: string,
            ) => {
                const smsPrebuilt: Partial<Record<SupportedLanguage, string>> =
                    {}
                for (const language of SUPPORTED_LANGUAGES) {
                    const rendered = renderSmsMessage({
                        message,
                        language,
                        params: sampleParams,
                        variant: variant !== 'default' ? variant : undefined,
                    })
                    smsPrebuilt[language] = injectPlaceholders(
                        rendered,
                        sampleParams,
                    )
                }

                const bundle = {
                    id: message.id,
                    variant: variant === 'default' ? undefined : variant,
                    languages: smsPrebuilt,
                }

                const fileName =
                    variant === 'default'
                        ? `${message.id}.sms.json`
                        : `${message.id}.${variant}.sms.json`

                const smsOutputPath =
                    customOutputPath ?? path.join(prebuiltDir, fileName)
                await fs.mkdir(path.dirname(smsOutputPath), {
                    recursive: true,
                })

                return await fs.writeFile(
                    smsOutputPath,
                    JSON.stringify(bundle, null, 2),
                    'utf8',
                )
            }

            if (variantList.length > 1 && message.variants?.length) {
                await Promise.all(
                    variantList.map(async (variant) => {
                        const baseSampleParams =
                            options.sampleParams?.[message.id] ??
                            SAMPLE_DEFAULTS[message.id] ??
                            {}
                        const params =
                            variant !== 'default'
                                ? {
                                      ...baseSampleParams,
                                      variant,
                                      ...(variant === 'externalOptics' &&
                                      'agreementUrl' in baseSampleParams
                                          ? {
                                                agreementUrl:
                                                    'https://www.sparkles-adhd.com/info-sharing-agreement-optics',
                                            }
                                          : {}),
                                  }
                                : baseSampleParams

                        await writeSmsPrebuilt(variant, params)
                    }),
                )
            } else {
                const baseSampleParams =
                    options.sampleParams?.[message.id] ??
                    SAMPLE_DEFAULTS[message.id] ??
                    {}
                await writeSmsPrebuilt(
                    'default',
                    baseSampleParams,
                    prebuiltTarget?.smsOutputPath,
                )
            }
        }

        const shouldPrebuildEmail =
            message.channels.email &&
            (prebuiltTarget || options.prebuildAllEmail)

        if (!skipPrebuilt && shouldPrebuildEmail) {
            const prebuiltDir =
                options.prebuiltDir ??
                path.join(options.repoRoot, 'notifications/prebuilt')

            const writeEmailPrebuilt = async (
                variant: string,
                params: Record<string, unknown>,
                outputPath?: string,
            ) => {
                const languages: Partial<
                    Record<
                        SupportedLanguage,
                        { subject: string; html: string; text: string }
                    >
                > = {}

                for (const language of SUPPORTED_LANGUAGES) {
                    const rendered = await renderEmail({
                        message,
                        language,
                        params,
                        assetBaseUrl,
                        env,
                        variant: variant !== 'default' ? variant : undefined,
                    })

                    languages[language] = {
                        subject: rendered.subject,
                        html: injectPlaceholders(rendered.htmlBody, params),
                        text: injectPlaceholders(rendered.textBody, params),
                    }
                }

                const prebuilt = {
                    id: message.id,
                    variant: variant === 'default' ? undefined : variant,
                    from: message.defaultFrom,
                    languages,
                }

                const filePath =
                    outputPath ??
                    path.join(
                        prebuiltDir,
                        variant === 'default'
                            ? `${message.id}.json`
                            : `${message.id}.${variant}.json`,
                    )

                await fs.mkdir(path.dirname(filePath), { recursive: true })
                await fs.writeFile(
                    filePath,
                    JSON.stringify(prebuilt, null, 2),
                    'utf8',
                )
            }

            if (prebuiltTarget) {
                const baseSampleParams =
                    options.sampleParams?.[message.id] ??
                    SAMPLE_DEFAULTS[message.id] ??
                    {}
                await writeEmailPrebuilt(
                    'default',
                    baseSampleParams,
                    prebuiltTarget.outputPath,
                )
            } else if (variantList.length > 1 && message.variants?.length) {
                await Promise.all(
                    variantList.map(async (variant) => {
                        const baseSampleParams =
                            options.sampleParams?.[message.id] ??
                            SAMPLE_DEFAULTS[message.id] ??
                            {}
                        const params =
                            variant !== 'default'
                                ? {
                                      ...baseSampleParams,
                                      variant,
                                      ...(variant === 'externalOptics' &&
                                      'agreementUrl' in baseSampleParams
                                          ? {
                                                agreementUrl:
                                                    'https://www.sparkles-adhd.com/info-sharing-agreement-optics',
                                            }
                                          : {}),
                                  }
                                : baseSampleParams

                        await writeEmailPrebuilt(variant, params)
                    }),
                )
            } else {
                const baseSampleParams =
                    options.sampleParams?.[message.id] ??
                    SAMPLE_DEFAULTS[message.id] ??
                    {}
                await writeEmailPrebuilt('default', baseSampleParams)
            }
        }

        if (!skipPrebuilt && message.channels.wati) {
            const prebuiltDir =
                options.prebuiltDir ??
                path.join(options.repoRoot, 'notifications/prebuilt')

            const writeWatiPrebuilt = async (
                variant: string,
                watiLocales: WatiLocaleMap,
            ) => {
                const bundle = {
                    id: message.id,
                    variant: variant === 'default' ? undefined : variant,
                    locales: watiLocales,
                }

                const fileName =
                    variant === 'default'
                        ? `${message.id}.wati.json`
                        : `${message.id}.${variant}.wati.json`

                await fs.mkdir(prebuiltDir, { recursive: true })
                await fs.writeFile(
                    path.join(prebuiltDir, fileName),
                    JSON.stringify(bundle, null, 2),
                    'utf8',
                )
            }

            if (variantList.length > 1 && message.variants?.length) {
                await Promise.all(
                    variantList.map(async (variant) => {
                        const watiForVariant =
                            typeof message.channels.wati === 'function'
                                ? message.channels.wati(
                                      variant !== 'default'
                                          ? (variant as never)
                                          : undefined,
                                  )
                                : message.channels.wati

                        if (watiForVariant) {
                            await writeWatiPrebuilt(variant, watiForVariant)
                        }
                    }),
                )
            } else if (message.channels.wati) {
                const watiLocales =
                    typeof message.channels.wati === 'function'
                        ? message.channels.wati(undefined)
                        : message.channels.wati

                if (watiLocales) {
                    await writeWatiPrebuilt('default', watiLocales)
                }
            }
        }
    }

    let manifestPath: string | undefined
    let manifest: CompileManifest | undefined

    if (includePreview) {
        manifest = {
            repoName: options.repoName,
            compiledAt: new Date().toISOString(),
            assetBaseUrl,
            bundles: manifestEntries,
        }

        manifestPath = path.join(previewDir, 'manifest.json')
        await fs.writeFile(
            manifestPath,
            JSON.stringify(manifest, null, 2),
            'utf8',
        )
    }

    let stamp: CompileStamp | undefined

    if (!skipPrebuilt) {
        const frameworkRoot =
            options.frameworkRoot ??
            resolveDefaultFrameworkRoot(options.repoRoot)
        const frameworkVersion =
            options.frameworkVersion ??
            JSON.parse(
                await fs.readFile(
                    path.join(frameworkRoot, 'package.json'),
                    'utf8',
                ),
            ).version

        const inputsHash = await computeCompileInputsHash({
            repoRoot: options.repoRoot,
            repoName: options.repoName,
            frameworkRoot,
            frameworkVersion,
            compileOptions: options,
        })

        stamp = {
            inputsHash,
            compiledAt: new Date().toISOString(),
            frameworkVersion,
            repoName: options.repoName,
        }

        await writeCompileStamp(
            getCompileStampPath(options.repoRoot, options.prebuiltDir),
            stamp,
        )
    }

    return { manifestPath, manifest, stamp }
}
