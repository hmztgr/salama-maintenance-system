/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for reliable deployment
  output: 'export',
  distDir: 'out',
  trailingSlash: true,

  // Disable image optimization for static export
  images: {
    unoptimized: true
  },

  // Ensure clean build
  eslint: {
    ignoreDuringBuilds: true
  }
};

module.exports = nextConfig;
