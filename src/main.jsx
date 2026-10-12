import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './shared/auth-context.jsx'
import { InstallProvider } from './shared/install-context.jsx'
import { ThemeProvider } from './shared/theme-context.jsx'
import { ToastProvider } from './shared/toast.jsx'
import './index.css'
import { logVisit } from './shared/visits.js'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

logVisit()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <InstallProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </InstallProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
)
