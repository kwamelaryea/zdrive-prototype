import type { AppProps } from 'next/app';
import { WalletProvider } from '../contexts/WalletContext';
import { VideoProvider } from '../contexts/VideoContext';
import { Toaster } from 'react-hot-toast';
import { initializeConsoleFilters } from '../utils/consoleFilters';
import '../styles/globals.css';

// Initialize console filters to suppress wallet provider noise
if (typeof window !== 'undefined') {
  initializeConsoleFilters();
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WalletProvider>
      <VideoProvider>
        <Component {...pageProps} />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </VideoProvider>
    </WalletProvider>
  );
} 