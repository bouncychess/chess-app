import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { configureAuth } from './config/auth'

configureAuth()

if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
  const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  if (link) link.href = '/rook-local.svg';
}

import { theme } from './config/theme'

// Set CSS variables from theme
document.documentElement.style.setProperty('--color-background', theme.colors.background);
document.documentElement.style.setProperty('--color-text', theme.colors.text);
document.documentElement.style.setProperty('--color-button-hover-border', theme.colors.buttonHoverBorder);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
