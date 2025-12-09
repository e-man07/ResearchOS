/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@research-os/core',
    '@research-os/mcp-connectors',
    '@research-os/agents',
    '@research-os/ingestion',
    '@research-os/rag',
  ],
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
}

module.exports = nextConfig
