import type { Config } from 'stylelint'

export default {
    extends: ['stylelint-config-standard-vue', 'stylelint-config-clean-order'],
    rules: { 'selector-class-pattern': null }
} satisfies Config
