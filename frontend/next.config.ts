import type { NextConfig } from "next";
import path from "path";

const backendSrc = path.join(__dirname, "../backend/src");
const sharedRoot = path.join(__dirname, "../shared");

const nextConfig: NextConfig = {
  // Allow importing server modules from ../backend and ../shared
  experimental: {
    externalDir: true,
  },
  transpilePackages: ["shared", "backend"],
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  turbopack: {
    resolveAlias: {
      "@backend": backendSrc,
      "@shared": sharedRoot,
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@backend": backendSrc,
      "@shared": sharedRoot,
    };
    return config;
  },
};

export default nextConfig;
