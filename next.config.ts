import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.NODE_ENV === "production" ? "/dodge-ball-chaos" : "",
  assetPrefix:
    process.env.NODE_ENV === "production" ? "/dodge-ball-chaos/" : "",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
