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

// Suppress common harmless console warnings that spam Sentry
const originalConsole = { ...console };
console.warn = (...args) => {
  const message = args.join(' ');
  const harmlessWarnings = [
    'Unrecognized feature',
    'ResizeObserver loop limit exceeded',
    'deprecated',
    'Permissions-Policy',
    'ambient-light-sensor',
    'vr',
    'battery'
  ];
  
  if (!harmlessWarnings.some(warning => message.includes(warning))) {
    originalConsole.warn(...args);
  }
};

// Initialize app
const startApp = async () => {
  await initializeCapacitor();
  createRoot(document.getElementById("root")!).render(<App />);
};

startApp();
