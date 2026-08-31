import * as Sentry from "@sentry/react";

/**
 * Initializes Sentry for the EduSpace Main App
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const isProduction = import.meta.env.PROD;

  if (!dsn) {
    if (isProduction) {
      // In production without DSN, warn once
      // (safe fallback so app never crashes without DSN)
    }
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || "development",
    release: "eduspace@" + (import.meta.env.VITE_APP_VERSION || "1.0.0"),
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: true,
      }),
    ],
    // Tracing
    tracesSampleRate: isProduction ? 0.2 : 1.0,
    tracePropagationTargets: ["localhost", /^\//],
    // Session Replay
    replaysSessionSampleRate: isProduction ? 0.05 : 0.1,
    replaysOnErrorSampleRate: 1.0,

    beforeSend(event, hint) {
      const error = hint?.originalException;
      const message =
        typeof error === "object" && error !== null && "message" in error
          ? String((error as { message?: unknown }).message)
          : typeof error === "string"
          ? error
          : "";

      // 1. Ignore benign network aborts and connectivity interruptions
      if (
        message.includes("Failed to fetch") ||
        message.includes("NetworkError") ||
        message.includes("Load failed") ||
        message.includes("AbortError") ||
        message.includes("AuthRetryableFetchError") ||
        message.includes("ResizeObserver loop")
      ) {
        return null;
      }

      // 2. Filter browser extension noise
      if (
        event.exception?.values?.some((val) =>
          val.stacktrace?.frames?.some((frame) =>
            frame.filename?.includes("chrome-extension://") ||
            frame.filename?.includes("moz-extension://")
          )
        )
      ) {
        return null;
      }

      return event;
    },
  });
}

/**
 * Tag current authenticated user to Sentry error context
 */
export function setSentryUser(user: { id?: string; role?: string; email?: string } | null) {
  if (!user || !user.id) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: user.id,
    email: user.email,
  });

  if (user.role) {
    Sentry.setTag("user_role", user.role);
  }
}

/**
 * Clear user context on logout
 */
export function clearSentryUser() {
  Sentry.setUser(null);
  Sentry.setTag("user_role", "anonymous");
}

/**
 * Capture manual exceptions with extra contextual tags
 */
export function captureAppError(error: unknown, context?: Record<string, unknown>) {
  if (context) {
    Sentry.withScope((scope) => {
      scope.setExtras(context);
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

/**
 * Log custom breadcrumbs for tracking user steps
 */
export function addAppBreadcrumb(category: string, message: string, data?: Record<string, unknown>) {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: "info",
  });
}
