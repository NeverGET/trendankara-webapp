// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    domains: ["trendankara.com", "localhost"],
  },
};

export default nextConfig;
