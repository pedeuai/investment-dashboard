/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['yahoo-finance2'],
  allowedDevOrigins: ['192.168.158.11'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.yahoo.com',
      },
      {
        protocol: 'https',
        hostname: '**.googleapis.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
  experimental: {
    optimizePackageImports: ['lucide-react']
  },
};

module.exports = nextConfig;