import * as Sentry from "@sentry/react";

/**
 * Initializes Sentry for the EduSpace Admin Portal
 */
export function initAdminSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const isProduction = import.meta.env.PROD;

  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || "development",
    release: "eduspace-admin@" + (import.meta.env.VITE_APP_VERSION || "1.0.0"),
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: isProduction ? 0.3 : 1.0,
    tracePropagationTargets: ["localhost", /^\//],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    beforeSend(event, hint) {
      const error = hint?.originalException;
      const message =
        typeof error === "object" && error !== null && "message" in error
          ? String((error as { message?: unknown }).message)
          : typeof error === "string"
          ? error
          : "";

      if (
        message.includes("Failed to fetch") ||
        message.includes("NetworkError") ||
        message.includes("AbortError") ||
        message.includes("AuthRetryableFetchError")
      ) {
        return null;
      }

      return event;
    },
  });

  // Tag application type
  Sentry.setTag("portal", "admin");
}

/**
 * Tag authenticated admin to Sentry
 */
export function setAdminSentryUser(user: { id?: string; email?: string } | null) {
  if (!user || !user.id) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: user.id,
    email: user.email,
  });
  Sentry.setTag("user_role", "admin");
}

/**
 * Clear admin Sentry user
 */
export function clearAdminSentryUser() {
  Sentry.setUser(null);
  Sentry.setTag("user_role", "anonymous_admin");
}

/**
 * Manually capture exception from admin portal
 */
export function captureAdminError(error: unknown, context?: Record<string, unknown>) {
  if (context) {
    Sentry.withScope((scope) => {
      scope.setExtras(context);
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}
