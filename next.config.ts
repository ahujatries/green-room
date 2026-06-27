import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root — a stray lockfile in the home dir otherwise
  // confuses Next's root inference and file tracing on deploy.
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
