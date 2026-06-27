// Sentry — browser runtime (Next 15 client instrumentation entrypoint). The
// Green Room's client surface is the streaming chat and the MediaRecorder voice
// loop in lib/use-voice-call.ts — both swallow errors in try/catch, so we also
// capture explicitly there. This catches everything else (render crashes, etc.).
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  // Session Replay is off by default — opt in later if the voice UX needs it.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  sendDefaultPii: false,
});

// Required by Sentry to instrument client-side navigations on the App Router.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
