module.exports = {
  root: true,
  customSyntax: 'postcss-less',
  plugins: ['stylelint-order', 'stylelint-config-rational-order/plugin'],
  extends: ['stylelint-config-standard', 'stylelint-config-rational-order'],
  overrides: [
    {
      files: ['*.html', '**/*.html'],
      extends: ['stylelint-config-html/html'],
      customSyntax: 'postcss-html',
    },
    {
      files: ['*.vue', '**/*.vue'],
      extends: ['stylelint-config-recommended-vue'],
      customSyntax: 'postcss-html',
    },
  ],
  rules: {
    'no-empty-source': null,
    'keyframes-name-pattern': null,
    'color-no-invalid-hex': true,
    'declaration-colon-space-after': 'always',
    'declaration-colon-space-before': 'never',
    'shorthand-property-no-redundant-values': true,
    'color-hex-case': 'lower',
    'no-descending-specificity': true,
    'block-closing-brace-newline-before': 'always',
    'declaration-empty-line-before': 'never',
    'font-family-name-quotes': 'always-unless-keyword',
    'no-eol-whitespace': true,
    'no-duplicate-selectors': true,
    'max-empty-lines': 1,
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['tailwind', 'apply', 'variants', 'responsive', 'screen'],
      },
    ],
    'order/order': [
      'dollar-variables',
      'custom-properties',
      {
        type: 'at-rule',
        name: 'include',
      },
      'declarations',
      {
        type: 'at-rule',
        name: 'content',
      },
    ],
    'plugin/rational-order': [
      true,
      {
        'border-in-box-model': false,
        'empty-line-between-groups': false,
      },
    ],
  },
}
