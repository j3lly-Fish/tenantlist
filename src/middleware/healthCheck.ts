/**
 * Health Check Middleware
 *
 * Provides health check, readiness, and liveness endpoints for production monitoring
 * and orchestration systems (Kubernetes, Docker Swarm, load balancers)
 */

import { Request, Response } from 'express';
import { Pool } from 'pg';
import Redis from 'ioredis';

interface HealthCheckOptions {
  dbPool: Pool;
  redisClient: Redis;
}

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  checks: {
    database: CheckResult;
    redis: CheckResult;
    memory: CheckResult;
  };
}

interface CheckResult {
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  responseTime?: number;
}

/**
 * Health check endpoint - overall system health
 * GET /health
 *
 * Returns 200 if all critical services are operational
 * Returns 503 if any critical service is down
 */
export function healthCheckHandler(options: HealthCheckOptions) {
  return async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    const checks: HealthCheckResult['checks'] = {
      database: await checkDatabase(options.dbPool),
      redis: await checkRedis(options.redisClient),
      memory: checkMemory(),
    };

    const allHealthy = Object.values(checks).every(check => check.status === 'pass');
    const anyFailed = Object.values(checks).some(check => check.status === 'fail');

    const result: HealthCheckResult = {
      status: anyFailed ? 'unhealthy' : (allHealthy ? 'healthy' : 'degraded'),
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
    };

    const statusCode = result.status === 'healthy' ? 200 : 503;
    const responseTime = Date.now() - startTime;

    res.status(statusCode).json({
      ...result,
      responseTime,
    });
  };
}

/**
 * Readiness check endpoint - is the service ready to accept traffic?
 * GET /ready
 *
 * Returns 200 when service is ready to serve requests
 * Returns 503 when service is starting up or shutting down
 */
export function readinessCheckHandler(options: HealthCheckOptions) {
  return async (req: Request, res: Response): Promise<void> => {
    const checks = {
      database: await checkDatabase(options.dbPool),
      redis: await checkRedis(options.redisClient),
    };

    const ready = Object.values(checks).every(check => check.status === 'pass');

    if (ready) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks,
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        checks,
      });
    }
  };
}

/**
 * Liveness check endpoint - is the service alive?
 * GET /live
 *
 * Returns 200 if the process is running
 * Used by orchestrators to detect if the process needs to be restarted
 */
export function livenessCheckHandler() {
  return (req: Request, res: Response): void => {
    // Simple check - if we can respond, we're alive
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  };
}

/**
 * Check database connectivity
 */
async function checkDatabase(pool: Pool): Promise<CheckResult> {
  const startTime = Date.now();
  try {
    const result = await pool.query('SELECT 1 as status');
    const responseTime = Date.now() - startTime;

    if (result.rows[0].status === 1) {
      return {
        status: 'pass',
        message: 'Database connection successful',
        responseTime,
      };
    } else {
      return {
        status: 'fail',
        message: 'Database query returned unexpected result',
        responseTime,
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      status: 'fail',
      message: error instanceof Error ? error.message : 'Database connection failed',
      responseTime,
    };
  }
}

/**
 * Check Redis connectivity
 */
async function checkRedis(client: Redis): Promise<CheckResult> {
  const startTime = Date.now();
  try {
    const result = await client.ping();
    const responseTime = Date.now() - startTime;

    if (result === 'PONG') {
      return {
        status: 'pass',
        message: 'Redis connection successful',
        responseTime,
      };
    } else {
      return {
        status: 'fail',
        message: 'Redis ping returned unexpected result',
        responseTime,
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      status: 'fail',
      message: error instanceof Error ? error.message : 'Redis connection failed',
      responseTime,
    };
  }
}

/**
 * Check memory usage
 */
function checkMemory(): CheckResult {
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  const usagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

  // Warn if memory usage is above 80%
  if (usagePercent > 80) {
    return {
      status: 'warn',
      message: `High memory usage: ${heapUsedMB}MB / ${heapTotalMB}MB (${usagePercent.toFixed(1)}%)`,
    };
  }

  return {
    status: 'pass',
    message: `Memory usage: ${heapUsedMB}MB / ${heapTotalMB}MB (${usagePercent.toFixed(1)}%)`,
  };
}

/**
 * Startup check - verify all critical services before accepting traffic
 */
export async function startupCheck(options: HealthCheckOptions): Promise<boolean> {
  console.log('Running startup health checks...');

  const checks = {
    database: await checkDatabase(options.dbPool),
    redis: await checkRedis(options.redisClient),
  };

  let allPassed = true;

  for (const [name, result] of Object.entries(checks)) {
    if (result.status === 'pass') {
      console.log(`✓ ${name}: ${result.message} (${result.responseTime}ms)`);
    } else {
      console.error(`✗ ${name}: ${result.message}`);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log('All startup checks passed - service is ready');
  } else {
    console.error('Startup checks failed - service is not ready');
  }

  return allPassed;
}

/**
 * Graceful shutdown handler
 */
export function setupGracefulShutdown(
  server: any,
  dbPool: Pool,
  redisClient: Redis
): void {
  let isShuttingDown = false;

  const shutdown = async (signal: string) => {
    if (isShuttingDown) {
      console.log('Shutdown already in progress...');
      return;
    }

    isShuttingDown = true;
    console.log(`Received ${signal}, starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(() => {
      console.log('HTTP server closed');
    });

    // Close database connections
    try {
      await dbPool.end();
      console.log('Database connections closed');
    } catch (error) {
      console.error('Error closing database connections:', error);
    }

    // Close Redis connections
    try {
      await redisClient.quit();
      console.log('Redis connections closed');
    } catch (error) {
      console.error('Error closing Redis connections:', error);
    }

    console.log('Graceful shutdown complete');
    process.exit(0);
  };

  // Handle shutdown signals
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', (error: Error) => {
    console.error('Uncaught exception:', error);
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
    shutdown('unhandledRejection');
  });
}

export default {
  healthCheckHandler,
  readinessCheckHandler,
  livenessCheckHandler,
  startupCheck,
  setupGracefulShutdown,
};
