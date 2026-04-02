import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { ConfirmProvider } from './components/ConfirmModal';
import { InstallProvider } from './components/InstallPrompt';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ConfirmProvider>
            <InstallProvider>
              <App />
            </InstallProvider>
          </ConfirmProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// iOS standalone mode: prevent links from opening in Safari
const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  || (navigator as any).standalone === true;

if (isStandalone) {
  // Intercept all clicks to keep navigation inside the app
  document.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('a');
    if (!target) return;
    const href = target.getAttribute('href');
    if (!href) return;
    // Allow internal links, mailto, tel
    if (href.startsWith('/') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    // External links: open in-app browser instead of Safari
    if (href.startsWith('http')) {
      // Allow WhatsApp and share links to open externally
      if (href.includes('wa.me') || href.includes('whatsapp')) return;
      e.preventDefault();
      window.location.href = href;
    }
  });

  // Disable iOS bounce/rubber-band effect on the body
  document.body.style.overscrollBehavior = 'none';
}
