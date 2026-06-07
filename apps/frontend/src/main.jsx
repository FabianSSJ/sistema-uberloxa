import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Polyfill para window.storage si no está definido (ej. entorno local del navegador)
if (typeof window !== 'undefined' && !window.storage) {
  window.storage = {
    get: async (key) => {
      const val = localStorage.getItem(key);
      return val ? { value: val } : null;
    },
    set: async (key, val) => {
      localStorage.setItem(key, val);
    }
  };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

