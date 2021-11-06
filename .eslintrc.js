module.exports = {
  root: true,
  ignorePatterns: ['node_modules/*', '.cache/*'],
  env: {
    commonjs: true,
    es6: true,
    node: true,
  },
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  extends: ['airbnb-base'],
  plugins: ['node', 'promise', 'import'],
  rules: {
    // base
    'max-len': ['error', { code: 150 }],
    indent: ['error', 2, { SwitchCase: 1 }],
    semi: ['error', 'never'],
    quotes: ['error', 'single'],
    'comma-dangle': ['error', 'always-multiline'],
    'object-curly-spacing': ['error', 'always'],
    'computed-property-spacing': 'error',
    'arrow-parens': ['error', 'always'],
    'linebreak-style': ['error', 'unix'],
    'operator-linebreak': ['error', 'before'],
    'no-underscore-dangle': [
      'error',
      {
        allow: ['_id', '_', '_transform', '_args', '_source'],
      },
    ],

    // plain
    radix: ['error', 'as-needed'],
    'no-debugger': 'error',
    'no-console': 'error',
    'no-new': 'off',
    'no-continue': 'off',
    'no-await-in-loop': 'off',
    'no-bitwise': 'error',
    'no-unused-vars': 'warn',

    // safe
    'prefer-destructuring': 'off',
    'prefer-template': 'off',
    'no-restricted-syntax': 'warn',
    'class-methods-use-this': 'off',
    'ts-nocheck': 'off',

    // miss safe
    'no-param-reassign': 'off',
    'import/no-extraneous-dependencies': 'off',
    'import/no-dynamic-require': 'off',
    'import/no-cycle': 'off',
    'global-require': 'off',

    // complexity
    'max-lines': ['warn', 800],
    'max-lines-per-function': ['warn', 400],
    complexity: ['warn', 15],
    'max-nested-callbacks': ['error', { max: 3 }],

  },
}
