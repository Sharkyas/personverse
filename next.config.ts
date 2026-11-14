import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  // Pin the workspace root so a stray package-lock.json in a parent folder (e.g. ~/) is not mistaken for it.
  outputFileTracingRoot: path.join(__dirname),
  serverExternalPackages: ["pg"],
  images: { formats: ["image/avif", "image/webp"] },
};

export default nextConfig;
