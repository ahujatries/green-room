"use client";

// App Router global error boundary. Catches React render errors at the root and
// forwards them to Sentry (these never reach the server `onRequestError` hook).
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0d07",
          color: "#f3eee3",
          fontFamily: "Helvetica, Arial, sans-serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <div>
          <p style={{ fontSize: 15, lineHeight: 1.6 }}>
            The room went dark for a second.
          </p>
          <button
            onClick={() => window.location.assign("/")}
            style={{
              marginTop: 16,
              padding: "9px 16px",
              borderRadius: 9,
              border: "none",
              background: "#a5e857",
              color: "#0f140d",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Back to the Green Room
          </button>
        </div>
      </body>
    </html>
  );
}
