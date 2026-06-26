import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Only run this code in the browser, not during SSR build
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
}