/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    domains: ["trendankara.com", "localhost"],
  },
};

module.exports = nextConfig;
