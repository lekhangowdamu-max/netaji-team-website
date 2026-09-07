import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'

import './index.css'
import App from './App.jsx'

// Register the PWA Service Worker
registerSW({
  immediate: true,

  onRegistered(registration) {
    console.log(
      '✅ PWA Service Worker registered:',
      registration
    )
  },

  onRegisterError(error) {
    console.error(
      '❌ PWA Service Worker registration failed:',
      error
    )
  },

  onOfflineReady() {
    console.log(
      '📱 PWA is ready to work offline.'
    )
  },

  onNeedRefresh() {
    console.log(
      '🔄 New version of the app is available.'
    )
  },
})

createRoot(
  document.getElementById('root')
).render(
  <StrictMode>
    <App />
  </StrictMode>
)