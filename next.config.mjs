// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker deployment
  output: "standalone",

  // Enable gzip compression
  compress: true,

  // Skip static page generation for client components during build
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },

  // Image optimization settings
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
    // Enable optimization for mobile performance
    deviceSizes: [320, 420, 640, 768, 1024, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Performance optimizations
  poweredByHeader: false,
  generateEtags: true,

  // Headers for caching and compression
  async headers() {
    return [
      {
        source: '/api/mobile/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
