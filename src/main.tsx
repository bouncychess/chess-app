import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { configureAuth } from './config/auth'

configureAuth()
import { theme } from './config/theme'

// Set CSS variables from theme
document.documentElement.style.setProperty('--color-background', theme.colors.background);
document.documentElement.style.setProperty('--color-text', theme.colors.text);
document.documentElement.style.setProperty('--color-button-hover-border', theme.colors.buttonHoverBorder);

createRoot(document.getElementById('root')!).render(
  <App />,
)
