import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'
import { AuthProvider } from '@/auth/AuthContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <div className="app-frame shadow-md">
          <App />
        </div>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
)

registerSW({ immediate: true })
