import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

// The private preview ships without Sentry: there's no DSN here, and the Sentry
// build wrapper auto-instruments the Edge middleware in a way that references
// Node's `__dirname` (undefined on the Edge runtime), crashing every request.
export default nextConfig;
