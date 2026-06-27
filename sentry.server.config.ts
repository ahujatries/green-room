// Sentry — server runtime (Node). Loaded from instrumentation.ts `register()`.
// The Green Room's server surface is four AI routes (chat/transcribe/voice-reply/
// speech) that fan out to the Vercel AI Gateway; this is where Gateway 429s,
// timeouts and decode failures surface, so we want them captured.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Modest sampling — this is an experiment, not a high-traffic app. Bump later.
  tracesSampleRate: 1.0,
  // Don't spam Sentry from local dev unless a DSN is explicitly set.
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  sendDefaultPii: false,
});
