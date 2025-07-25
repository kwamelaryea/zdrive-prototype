import type { AppProps } from 'next/app';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { WalletProvider } from '../src/contexts/WalletContext';
import { VideoProvider } from '../src/contexts/VideoContext';
import { LivepeerProvider } from '../src/components/LivepeerProvider';
import { Toaster } from 'react-hot-toast';
import '../src/index.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <WalletProvider>
        <VideoProvider>
          <LivepeerProvider>
            <Component {...pageProps} />
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'rgb(17, 24, 39)',
                  color: 'white',
                  border: '1px solid rgb(55, 65, 81)',
                },
              }}
            />
          </LivepeerProvider>
        </VideoProvider>
      </WalletProvider>
    </ThemeProvider>
  );
}