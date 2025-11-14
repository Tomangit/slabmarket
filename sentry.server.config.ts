// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === "development",
  
  // Set release
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
  environment: process.env.NODE_ENV,
  
  // Filter out localhost and development errors in production
  beforeSend(event, hint) {
    if (process.env.NODE_ENV === "development") {
      console.log("Sentry Server Event:", event);
      console.log("Sentry Server Hint:", hint);
    }
    
    // Filter out localhost errors in production
    if (
      process.env.NODE_ENV === "production" &&
      event.request?.url?.includes("localhost")
    ) {
      return null;
    }
    
    return event;
  },
});

