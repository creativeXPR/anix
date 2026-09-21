import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // functions/ is a separate Node/CommonJS subproject (Cloud Functions),
  // not part of the Vite-bundled browser app this config targets.
  globalIgnores(['dist', 'functions']),
  {
    files: ['**/*.{js,jsx}'],
    ignores: ['public/sw.js'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  // public/sw.js runs as a classic-script service worker, not a Vite-
  // bundled module — importScripts/firebase (from the Firebase Messaging
  // compat script it importScripts()'s in) aren't browser-window globals.
  {
    files: ['public/sw.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: { ...globals.serviceworker, firebase: 'readonly' },
    },
  },
])
