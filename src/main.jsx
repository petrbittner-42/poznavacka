import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles.css'
import { inject } from '@vercel/analytics'

// Anonymní počítadlo návštěv (Vercel Web Analytics) – jen na nasazené verzi, ne lokálně.
if (import.meta.env.PROD) inject()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
