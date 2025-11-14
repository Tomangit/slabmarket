/**
 * Sentry utility functions
 * Use these functions to manually capture errors and events in your application
 */

import * as Sentry from "@sentry/nextjs";

/**
 * Capture an exception in Sentry
 */
export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    contexts: {
      custom: context || {},
    },
  });
}

/**
 * Capture a message in Sentry
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "info",
  context?: Record<string, any>
) {
  Sentry.captureMessage(message, {
    level,
    contexts: {
      custom: context || {},
    },
  });
}

/**
 * Set user context for Sentry
 */
export function setUser(user: {
  id?: string;
  email?: string;
  username?: string;
  [key: string]: any;
}) {
  Sentry.setUser(user);
}

/**
 * Clear user context
 */
export function clearUser() {
  Sentry.setUser(null);
}

/**
 * Set additional context
 */
export function setContext(key: string, context: Record<string, any>) {
  Sentry.setContext(key, context);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
  Sentry.addBreadcrumb(breadcrumb);
}

/**
 * Start a transaction for performance monitoring
 */
export function startTransaction(
  name: string,
  op: string = "navigation"
): Sentry.Transaction | undefined {
  if (typeof window === "undefined") {
    // Server-side, use Sentry.startTransaction
    return Sentry.startTransaction({
      name,
      op,
    });
  }
  return undefined;
}

/**
 * Capture a transaction
 */
export function finishTransaction(transaction: Sentry.Transaction | undefined) {
  if (transaction) {
    transaction.finish();
  }
}

