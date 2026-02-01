import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Use this package as root so CI and local don't pick up parent lockfiles
    root: path.join(__dirname),
  },
};

export default nextConfig;
