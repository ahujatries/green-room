import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Pin the workspace root — a stray lockfile in the home dir otherwise
  // confuses Next's root inference and file tracing on deploy.
  outputFileTracingRoot: process.cwd(),
};

// Sentry wraps the build to upload source maps (when SENTRY_AUTH_TOKEN is set)
// and tunnel browser events past ad-blockers. Org/project are read from env so
// nothing is hard-coded; the wrapper is a no-op locally without a DSN.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Quiet build logs unless a CI token is present.
  silent: !process.env.CI,
  // Route browser events through /monitoring to dodge ad-blockers.
  tunnelRoute: "/monitoring",
  // Only attempt the source-map upload step when a token is actually provided.
  authToken: process.env.SENTRY_AUTH_TOKEN,
});
