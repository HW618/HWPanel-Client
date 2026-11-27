// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

const noBareCjk = require('./tooling/eslint-rules/no-bare-cjk');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/**', 'coverage/**', 'ios/**', 'android/**', '.expo/**', 'tooling/**'],
  },
  {
    files: ['app/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}', 'modules/**/*.{ts,tsx}'],
    plugins: {
      hwp: {
        rules: {
          'no-bare-cjk': noBareCjk,
        },
      },
    },
    rules: {
      'hwp/no-bare-cjk': 'error',
    },
  },
]);
