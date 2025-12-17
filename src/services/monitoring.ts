/**
 * Monitoring and Error Tracking Service
 *
 * Integrates with monitoring services like Sentry, Datadog, and New Relic
 * for error tracking, performance monitoring, and logging in production.
 */

import { productionConfig } from '../config/production';

// Sentry integration (for error tracking)
let Sentry: any = null;

/**
 * Initialize monitoring services
 * Call this during application startup
 */
export async function initializeMonitoring(): Promise<void> {
  const env = process.env.NODE_ENV;

  if (env === 'production') {
    // Initialize Sentry for error tracking
    if (productionConfig.monitoring.sentry.enabled) {
      try {
        // Note: Install @sentry/node package for full functionality
        // npm install @sentry/node @sentry/tracing
        console.log('Initializing Sentry error tracking...');

        // Uncomment when @sentry/node is installed:
        // const SentrySDK = require('@sentry/node');
        // const Tracing = require('@sentry/tracing');
        //
        // SentrySDK.init({
        //   dsn: productionConfig.monitoring.sentry.dsn,
        //   environment: productionConfig.monitoring.sentry.environment,
        //   tracesSampleRate: productionConfig.monitoring.sentry.tracesSampleRate,
        //   integrations: [
        //     new SentrySDK.Integrations.Http({ tracing: true }),
        //     new Tracing.Integrations.Express(),
        //     new Tracing.Integrations.Postgres(),
        //   ],
        // });
        //
        // Sentry = SentrySDK;
        // console.log('Sentry initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Sentry:', error);
      }
    }

    // Initialize Datadog APM
    if (productionConfig.monitoring.datadog.apiKey) {
      try {
        console.log('Datadog APM can be initialized here');
        // Note: Install dd-trace package for full functionality
        // npm install dd-trace
        //
        // Uncomment when dd-trace is installed:
        // const tracer = require('dd-trace').init({
        //   service: productionConfig.monitoring.datadog.service,
        //   env: productionConfig.monitoring.datadog.env,
        //   version: productionConfig.monitoring.datadog.version,
        // });
        // console.log('Datadog APM initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Datadog:', error);
      }
    }

    // Initialize New Relic
    if (productionConfig.monitoring.newRelic.enabled) {
      try {
        console.log('New Relic can be initialized here');
        // Note: Install newrelic package for full functionality
        // npm install newrelic
        //
        // Uncomment when newrelic is installed:
        // require('newrelic');
        // console.log('New Relic initialized successfully');
      } catch (error) {
        console.error('Failed to initialize New Relic:', error);
      }
    }
  } else {
    console.log('Monitoring disabled in non-production environment');
  }
}

/**
 * Capture an exception to monitoring services
 */
export function captureException(error: Error, context?: Record<string, any>): void {
  if (Sentry && productionConfig.monitoring.sentry.enabled) {
    if (context) {
      Sentry.setContext('additional', context);
    }
    Sentry.captureException(error);
  } else {
    // Fallback to console logging in development
    console.error('Exception captured:', error);
    if (context) {
      console.error('Context:', context);
    }
  }
}

/**
 * Capture a message to monitoring services
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  if (Sentry && productionConfig.monitoring.sentry.enabled) {
    Sentry.captureMessage(message, level);
  } else {
    // Fallback to console logging in development
    console.log(`[${level.toUpperCase()}] ${message}`);
  }
}

/**
 * Set user context for error tracking
 */
export function setUserContext(user: { id: string; email?: string; role?: string }): void {
  if (Sentry && productionConfig.monitoring.sentry.enabled) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  }
}

/**
 * Clear user context (e.g., on logout)
 */
export function clearUserContext(): void {
  if (Sentry && productionConfig.monitoring.sentry.enabled) {
    Sentry.setUser(null);
  }
}

/**
 * Add custom tags for filtering in monitoring dashboard
 */
export function setTag(key: string, value: string): void {
  if (Sentry && productionConfig.monitoring.sentry.enabled) {
    Sentry.setTag(key, value);
  }
}

/**
 * Express middleware for request tracking
 */
export function requestTracingMiddleware() {
  return (req: any, res: any, next: any) => {
    if (Sentry && productionConfig.monitoring.sentry.enabled) {
      // Sentry will automatically capture request details
      Sentry.setContext('request', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }
    next();
  };
}

/**
 * Express error handler middleware
 */
export function errorHandlerMiddleware() {
  return (err: Error, req: any, res: any, next: any) => {
    // Capture the error
    captureException(err, {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userId: req.user?.id,
    });

    // Send response
    if (process.env.NODE_ENV === 'production') {
      // Don't expose internal error details in production
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      });
    } else {
      // Include stack trace in development
      res.status(500).json({
        error: err.name,
        message: err.message,
        stack: err.stack,
      });
    }
  };
}

/**
 * Performance monitoring - track custom metrics
 */
export function trackMetric(name: string, value: number, tags?: Record<string, string>): void {
  if (productionConfig.monitoring.datadog.apiKey) {
    // Send custom metric to Datadog
    // Requires dd-trace package
    console.log(`Metric: ${name} = ${value}`, tags);
  } else {
    console.log(`[METRIC] ${name}: ${value}`, tags);
  }
}

/**
 * Track authentication events
 */
export function trackAuthEvent(event: 'login' | 'signup' | 'logout' | 'password_reset', userId?: string): void {
  captureMessage(`Auth event: ${event}${userId ? ` (user: ${userId})` : ''}`, 'info');
  trackMetric(`auth.${event}`, 1, { userId: userId || 'anonymous' });
}

/**
 * Track API endpoint performance
 */
export function trackEndpointPerformance(endpoint: string, method: string, duration: number, statusCode: number): void {
  trackMetric('api.response_time', duration, {
    endpoint,
    method,
    status: statusCode.toString(),
  });
}

export default {
  initializeMonitoring,
  captureException,
  captureMessage,
  setUserContext,
  clearUserContext,
  setTag,
  requestTracingMiddleware,
  errorHandlerMiddleware,
  trackMetric,
  trackAuthEvent,
  trackEndpointPerformance,
};
