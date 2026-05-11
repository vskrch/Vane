import pkg from './package.json' with { type: 'json' };

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: 's2.googleusercontent.com',
      },
      {
        hostname: 'i.ytimg.com',
      },
      {
        hostname: 'img.youtube.com',
      },
      {
        hostname: '**.duckduckgo.com',
      },
      {
        hostname: '**.wikipedia.org',
      },
      {
        hostname: '**.wikimedia.org',
      },
      {
        hostname: '**.redditmedia.com',
      },
      {
        hostname: '**.redd.it',
      },
      {
        hostname: '**.githubusercontent.com',
      },
      {
        hostname: '**.cloudfront.net',
      },
      {
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
  },
  serverExternalPackages: [
    'pdf-parse',
    'playwright',
    'officeparser',
    'file-type',
  ],
  outputFileTracingIncludes: {
    '/api/**': [
      './node_modules/@napi-rs/canvas/**',
      './node_modules/@napi-rs/canvas-linux-x64-gnu/**',
      './node_modules/@napi-rs/canvas-linux-x64-musl/**',
    ],
  },
  env: {
    NEXT_PUBLIC_VERSION: pkg.version,
  },
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@phosphor-icons/react',
      'react-syntax-highlighter',
    ],
  },
};

export default nextConfig;
