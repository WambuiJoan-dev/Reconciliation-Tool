import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// No longer importing global CSS files as styling is handled by Tailwind
// import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
