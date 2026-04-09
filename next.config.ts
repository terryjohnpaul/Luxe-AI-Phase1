import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["facebook-nodejs-business-sdk", "google-ads-api", "bullmq", "ioredis"],
};

export default nextConfig;
