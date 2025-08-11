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

// Initialize app
const startApp = async () => {
  await initializeCapacitor();
  createRoot(document.getElementById("root")!).render(<App />);
};

startApp();
