import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import { globalIgnores } from 'eslint/config'
import skipFormatting from 'eslint-config-prettier/flat'
import pluginOxlint from 'eslint-plugin-oxlint'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import pluginVue from 'eslint-plugin-vue'

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
    {
        name: 'app/files-to-lint',
        files: ['**/*.{vue,ts,mts,tsx}'],
        plugins: {
            'simple-import-sort': simpleImportSort
        },
        rules: {
            'no-unused-vars': 'off',
            'simple-import-sort/imports': 'warn',
            'simple-import-sort/exports': 'warn',
            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_'
                }
            ],
            'vue/attributes-order': ['warn', { alphabetical: true }]
        }
    },

    globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

    ...pluginVue.configs['flat/recommended'],
    vueTsConfigs.recommended,
    ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),
    skipFormatting
)
