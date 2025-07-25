import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en" className="dark">
      <Head>
        <meta name="description" content="ZDrive - NFT-based video streaming platform on Arweave" />
        <meta name="keywords" content="NFT, video streaming, Arweave, blockchain, creator economy" />
        <meta name="author" content="ZDrive" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
      </Head>
      <body className="bg-black text-white" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}