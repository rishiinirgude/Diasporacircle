import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { analytics } from './lib/analytics';

// Global error monitoring
window.addEventListener('error', (event) => {
  analytics.track('js_error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
  console.error('[Monitor] Uncaught error:', event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  analytics.track('unhandled_promise_rejection', {
    reason: String(event.reason),
  });
  console.error('[Monitor] Unhandled rejection:', event.reason);
});

// Track page views on navigation
const originalPushState = history.pushState.bind(history);
history.pushState = (...args) => {
  originalPushState(...args);
  analytics.track('page_view', { path: window.location.pathname });
};

// Initial page view
analytics.track('page_view', { path: window.location.pathname });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
