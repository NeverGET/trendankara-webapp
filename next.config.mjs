// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Temporarily disabled due to Next.js 15.5.3 error page bundling issue
  // output: "standalone",
  images: {
    domains: ["trendankara.com", "localhost", "82.29.169.180"],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '82.29.169.180',
        port: '9002',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: 'trendankara.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      }
    ],
    unoptimized: true, // For development, disable optimization for external images
  },
};

export default nextConfig;
