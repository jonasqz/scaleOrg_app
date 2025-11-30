/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@scleorg/calculations',
    '@scleorg/database',
    '@scleorg/types',
    '@scleorg/ui',
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

module.exports = nextConfig;
