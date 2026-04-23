import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, ScrollRestoration } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// Initialize appearance from server (if available) before mounting app to avoid FOUC
(async function initAndMount() {
  try {
    const resp = await fetch('/api/admin/settings', { credentials: 'include' });
    if (resp && resp.ok) {
      const json = await resp.json();
      const d = json?.data || json || {};
      const appearance = {
        theme: d.theme ?? null,
        primaryColor: d.primaryColor ?? null,
      };
      try {
        if (appearance.primaryColor) {
          document.documentElement.style.setProperty('--brand-green', appearance.primaryColor);
          document.documentElement.style.setProperty('--brand-green-dark', appearance.primaryColor);
        }
        if (appearance.theme === 'dark') document.documentElement.classList.add('dark');
        else if (appearance.theme === 'light') document.documentElement.classList.remove('dark');
        else {
          const mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
          if (mq) {
            if (mq.matches) document.documentElement.classList.add('dark');
            else document.documentElement.classList.remove('dark');
          }
        }
      } catch (e) { /* ignore */ }
      try { localStorage.setItem('appearance', JSON.stringify(appearance)); } catch (e) {}
    }
  } catch (e) {
    // ignore network errors; fallback to localStorage/index.html script
  }

  const router = createBrowserRouter([{ path: "*", element: <><ScrollRestoration /><App /></> }])

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  )
})();