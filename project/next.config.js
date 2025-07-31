/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['arweave.net', 'gateway.arweave.net'],
  },
  env: {
    // Production AO Process IDs
    NEXT_PUBLIC_CREATOR_NFT_PROCESS: process.env.NEXT_PUBLIC_CREATOR_NFT_PROCESS || 'Lk-5IzUn46w7d0BliSvR9Yo4jazeEZ1kxt54F2SlpPc',
    NEXT_PUBLIC_BASIC_ACCESS_PROCESS: process.env.NEXT_PUBLIC_BASIC_ACCESS_PROCESS || 'VxGBhfTqCQwrcxovPPpY6fdHqooHh8xITuI5ry3lTJs',
    NEXT_PUBLIC_PREMIUM_ACCESS_PROCESS: process.env.NEXT_PUBLIC_PREMIUM_ACCESS_PROCESS || 'IXOzHMQZoBIyq_mtcoHG9mfhusxSwYu932wWB6L6RjE',
    NEXT_PUBLIC_ACCESS_CONTROL_PROCESS: process.env.NEXT_PUBLIC_ACCESS_CONTROL_PROCESS || 'X-Lbejt0NVMaYtknT9FW9FhXNeH8-pu0t7Y2ej0iawI',
    NEXT_PUBLIC_TOKEN_PROCESS: process.env.NEXT_PUBLIC_TOKEN_PROCESS || 'your_token_process_id',
    
    // Platform Configuration
    NEXT_PUBLIC_PLATFORM_WALLET: process.env.NEXT_PUBLIC_PLATFORM_WALLET || 'WJw8VdUteXegMDMEUmpT0ly39F4Uobn_KyX2fFDs8eg',
    NEXT_PUBLIC_UPLOAD_FEE_PERCENTAGE: process.env.NEXT_PUBLIC_UPLOAD_FEE_PERCENTAGE || '0.0085',
    NEXT_PUBLIC_PLATFORM_FEE_PERCENTAGE: process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENTAGE || '0.10',
    NEXT_PUBLIC_CREATOR_SHARE_PERCENTAGE: process.env.NEXT_PUBLIC_CREATOR_SHARE_PERCENTAGE || '0.90',
    NEXT_PUBLIC_ROYALTY_PERCENTAGE: process.env.NEXT_PUBLIC_ROYALTY_PERCENTAGE || '0.10',
    
    // AO Network Configuration
    NEXT_PUBLIC_AO_GATEWAY_URL: process.env.NEXT_PUBLIC_AO_GATEWAY_URL || 'https://arweave.net',
    NEXT_PUBLIC_AO_CU_URL: process.env.NEXT_PUBLIC_AO_CU_URL || 'https://cu.ao.dev',
    NEXT_PUBLIC_AO_MU_URL: process.env.NEXT_PUBLIC_AO_MU_URL || 'https://mu.ao.dev',
    NEXT_PUBLIC_AO_SU_URL: process.env.NEXT_PUBLIC_AO_SU_URL || 'https://su.ao.dev',
    NEXT_PUBLIC_ENABLE_PRODUCTION_FALLBACK: process.env.NEXT_PUBLIC_ENABLE_PRODUCTION_FALLBACK,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer'),
    };
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;