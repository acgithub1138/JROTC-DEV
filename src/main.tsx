import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize Capacitor only on native platforms
const initializeCapacitor = async () => {
  if (typeof window !== 'undefined' && window.location.protocol === 'capacitor:') {
    const { Capacitor } = await import('@capacitor/core');
    if (Capacitor.isNativePlatform()) {
      console.log('Running on native platform:', Capacitor.getPlatform());
    }
  }
};

// Global error handler to prevent Sentry spam and suppress Chrome violation warnings
const setupGlobalErrorHandling = () => {
  const harmlessErrors = [
    'Unrecognized feature',
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    'Script error',
    'NetworkError',
    'ChunkLoadError',
    'Loading chunk',
    'Loading CSS chunk',
    'Failed to fetch dynamically imported module'
  ];

  // Suppress Chrome's [Violation] warnings from Tailwind CDN postMessage handlers
  // These are development-only warnings caused by Lovable's live preview JIT compilation
  if (import.meta.env.DEV) {
    const originalWarn = console.warn;
    const originalLog = console.log;
    
    const suppressPattern = /\[Violation\].*handler took/;
    
    console.warn = (...args: unknown[]) => {
      const message = args[0];
      if (typeof message === 'string' && suppressPattern.test(message)) {
        return; // Suppress Tailwind CDN JIT violation warnings
      }
      originalWarn.apply(console, args);
    };
    
    console.log = (...args: unknown[]) => {
      const message = args[0];
      if (typeof message === 'string' && suppressPattern.test(message)) {
        return; // Suppress Tailwind CDN JIT violation warnings
      }
      originalLog.apply(console, args);
    };
  }

  let errorCount = 0;
  let lastErrorTime = 0;
  const maxErrorsPerMinute = 5;

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    const errorMessage = error?.message || error?.toString() || '';
    
    const isHarmless = harmlessErrors.some(harmless => 
      errorMessage.includes(harmless)
    );
    
    if (isHarmless) {
      event.preventDefault();
      return;
    }

    const now = Date.now();
    if (now - lastErrorTime > 60000) {
      errorCount = 1;
      lastErrorTime = now;
    } else {
      errorCount++;
    }

    if (errorCount >= maxErrorsPerMinute) {
      event.preventDefault();
    }
  });

  // Handle regular errors
  window.addEventListener('error', (event) => {
    const error = event.error;
    const errorMessage = error?.message || event.message || '';
    
    const isHarmless = harmlessErrors.some(harmless => 
      errorMessage.includes(harmless)
    );
    
    if (isHarmless) {
      event.preventDefault();
      return;
    }

    const now = Date.now();
    if (now - lastErrorTime > 60000) {
      errorCount = 1;
      lastErrorTime = now;
    } else {
      errorCount++;
    }

    if (errorCount >= maxErrorsPerMinute) {
      event.preventDefault();
    }
  });
};

// Initialize app
const startApp = async () => {
  setupGlobalErrorHandling();
  await initializeCapacitor();
  createRoot(document.getElementById("root")!).render(<App />);
};

startApp();
