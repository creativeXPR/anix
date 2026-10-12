// App version from package.json (vite.config.js `define`), shown as
// major.minor — "v1.1".
export const APP_VERSION = `v${(import.meta.env.VITE_APP_VERSION || '').split('.').slice(0, 2).join('.')}`
