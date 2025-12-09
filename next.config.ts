import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
  // Empty turbopack config to silence the warning
  // Webpack config is still needed for react-pdf compatibility
  turbopack: {},
};

export default nextConfig;
