import { createSharedConfig } from '@vizo-o/dev-tools/eslint-config/eslint.config.mjs'

const config = createSharedConfig({ isNodeEnv: true })

config.push({
    files: ['**/*.spec.ts', '**/*.spec.tsx', '**/test/**/*.{ts,tsx}'],
    languageOptions: {
        parserOptions: {
            project: './tsconfig.test.json',
        },
        globals: {
            jest: 'readonly',
            describe: 'readonly',
            it: 'readonly',
            expect: 'readonly',
            beforeEach: 'readonly',
            afterEach: 'readonly',
            beforeAll: 'readonly',
            afterAll: 'readonly',
            NodeJS: 'readonly',
        },
    },
})

export default config
