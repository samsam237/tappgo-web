/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // With Nginx reverse proxy, use relative URLs
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
  },

  // No rewrites needed - Nginx handles the routing
  // Frontend calls /api/v1/* directly
  // Nginx proxies to backend at 127.0.0.1:5550

  images: {
    // Portable image domains configuration
    // Set IMAGE_DOMAINS env var with comma-separated domains
    domains: process.env.IMAGE_DOMAINS
      ? process.env.IMAGE_DOMAINS.split(',').map(d => d.trim())
      : [],
    // Allow any domain for development flexibility
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },

  output: 'standalone',
};

module.exports = nextConfig;
