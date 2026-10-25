import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep development and production output isolated through NEXT_DIST_DIR.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  /* config options here */
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "static.ticimax.cloud" }],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
