import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import profileRoutes from './routes/profileRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import brokerRoutes from './routes/brokerRoutes';
import mfaRoutes from './routes/mfaRoutes';
import businessRoutes from './routes/businessRoutes';
import demandListingRoutes from './routes/demandListingRoutes';
import propertyListingRoutes from './routes/propertyListingRoutes';
import messagingRoutes from './routes/messagingRoutes';
import matchingRoutes from './routes/matchingRoutes';
import notificationRoutes from './routes/notificationRoutes';
import marketInsightsRoutes from './routes/marketInsightsRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import { HttpsEnforcementMiddleware } from './middleware/securityMiddleware';
import { TokenRefreshMiddleware } from './middleware/authMiddleware';

/**
 * Create and configure Express application
 */
export function createApp(): Express {
  const app = express();

  // Trust proxy (for getting real IP behind load balancers)
  app.set('trust proxy', true);

  // CORS configuration
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // HTTPS enforcement middleware (production only)
  const httpsEnforcement = new HttpsEnforcementMiddleware();
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    const result = await httpsEnforcement.check(req);

    if (!result.allowed && result.redirect) {
      // Redirect to HTTPS
      return res.redirect(result.statusCode || 301, result.redirect);
    }

    // Set HSTS header if provided
    if (result.headers) {
      Object.entries(result.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
    }

    next();
  });

  // Stripe webhook needs raw body - must be before express.json()
  app.use('/api/subscriptions/webhook', express.raw({ type: 'application/json' }));

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Token refresh middleware (automatic token refresh)
  const tokenRefreshMiddleware = new TokenRefreshMiddleware();
  app.use(tokenRefreshMiddleware.getMiddleware());

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  // Authentication routes
  app.use('/api/auth', authRoutes);

  // MFA routes (built but disabled for MVP)
  app.use('/api/auth/mfa', mfaRoutes);

  // User management routes
  app.use('/api/users', userRoutes);

  // Profile routes
  app.use('/api/profile', profileRoutes);

  // Dashboard routes
  app.use('/api/dashboard', dashboardRoutes);

  // Broker routes
  app.use('/api/broker', brokerRoutes);

  // Business routes
  app.use('/api/businesses', businessRoutes);

  // Demand listing routes
  app.use('/api/demand-listings', demandListingRoutes);

  // Property listing routes
  app.use('/api/property-listings', propertyListingRoutes);

  // Messaging routes
  app.use('/api/messages', messagingRoutes);

  // Matching routes
  app.use('/api/matches', matchingRoutes);

  // Notification routes
  app.use('/api/notifications', notificationRoutes);

  // Market insights routes
  app.use('/api/market-insights', marketInsightsRoutes);

  // Subscription routes
  app.use('/api/subscriptions', subscriptionRoutes);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint not found',
      },
    });
  });

  // Error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  });

  return app;
}

// Export app instance for testing
const app = createApp();
export default app;
