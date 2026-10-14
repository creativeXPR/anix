import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import { defineConfig } from 'vite'

const pkg = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

// /m/** and /r/** are served by the linkPreview Cloud Function from a copy
// of index.html bundled with the function (functions/index-template.html).
// That copy used to reference the content-hashed bundle directly, so any
// hosting-only deploy left the function pointing at a JS file that no
// longer exists — links went blank ("Expected a JavaScript module… MIME
// type text/html"). Fix (2026-10-12): every build also writes two
// fixed-name files, /boot.js and /boot.css, that import the current hashed
// bundle, and the function's template loads those instead. The template
// therefore never goes stale; hosting and functions can deploy separately.
function stableBootEntry() {
  return {
    name: 'anix-stable-boot-entry',
    apply: 'build',
    closeBundle() {
      const html = fs.readFileSync('dist/index.html', 'utf8')
      const script = html.match(/<script type="module"[^>]*src="(\/assets\/[^"]+\.js)"[^>]*><\/script>/)
      const styles = [...html.matchAll(/<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"[^>]*>/g)]
      if (!script) throw new Error('stableBootEntry: no entry script in dist/index.html')

      // Static imports in boot.js download in parallel — list the vendor
      // chunks index.html modulepreloads first, so link pages don't fetch
      // entry → react → firebase one after another on slow data.
      const preloads = [...html.matchAll(/<link rel="modulepreload"[^>]*href="(\/assets\/[^"]+\.js)"[^>]*>/g)].map((m) => m[1])
      fs.writeFileSync('dist/boot.js', [...preloads, script[1]].map((src) => `import '${src}'`).join('\n') + '\n')
      fs.writeFileSync('dist/boot.css', styles.map((m) => `@import url('${m[1]}');`).join('\n') + '\n')

      const template = html
        .replace(script[0], '<script type="module" src="/boot.js"></script>')
        .replace(/<link rel="stylesheet"[^>]*href="\/assets\/[^"]+\.css"[^>]*>/g, '')
        .replace(/<link rel="modulepreload"[^>]*href="\/assets\/[^"]+"[^>]*>\s*/g, '')
        .replace('</head>', '  <link rel="stylesheet" href="/boot.css">\n  </head>')
      fs.writeFileSync('functions/index-template.html', template)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), stableBootEntry()],
  build: {
    rollupOptions: {
      output: {
        // Vendor code that rarely changes gets its own long-cached chunks,
        // so an app deploy doesn't make returning visitors re-download
        // React or Firebase (bundle split, 2026-10-14).
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) return 'react'
          if (/[\\/]node_modules[\\/](@firebase[\\/](app|component|logger|util|auth|firestore|webchannel-wrapper)|firebase[\\/](app|auth|firestore))[\\/]/.test(id)) return 'firebase'
          return undefined
        },
      },
    },
  },
  define: {
    // shown as "v1.1" (major.minor) in Profile and /admin
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
  },
})
