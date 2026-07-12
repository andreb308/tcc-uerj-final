import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
  outputFileTracingIncludes: {
    '/api/songs/**/*': ['node_modules/@sparticuz/chromium/bin/**/*'],
  },
  experimental: {
    optimizePackageImports: ['@phosphor-icons/react'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'cdn-images.dzcdn.net',
      },
      {
        protocol: 'https',
        hostname: 'cdn-images.dzcdn.net',
      },
      {
        protocol: 'http',
        hostname: 'api.deezer.com',
      },
      {
        protocol: 'https',
        hostname: 'api.deezer.com',
      },
    ],
  },
};

export default nextConfig;
