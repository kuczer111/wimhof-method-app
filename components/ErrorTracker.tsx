'use client';

import { useEffect } from 'react';

const ERROR_ENDPOINT = '/api/error';

function sendError(error: { type: string; message: string; stack?: string }) {
  const payload = JSON.stringify({
    type: error.type,
    message: error.message,
    stack: error.stack?.slice(0, 1000),
    url: window.location.pathname,
    timestamp: Date.now(),
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon(ERROR_ENDPOINT, payload);
  }
}

export function trackError(type: string, error: unknown, context?: string) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  sendError({
    type,
    message: context ? `${context}: ${message}` : message,
    stack,
  });
}

export default function ErrorTracker() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      sendError({
        type: 'unhandled_error',
        message: event.message,
        stack: event.error?.stack,
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      sendError({
        type: 'unhandled_rejection',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return null;
}
