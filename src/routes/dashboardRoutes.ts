import { Router, Request, Response } from 'express';
import { RoleGuardMiddleware } from '../middleware/roleGuardMiddleware';
import { ProfileCompletionGuard } from '../middleware/ProfileCompletionGuard';
import { DashboardController } from '../controllers/DashboardController';
import { LandlordDashboardController } from '../controllers/LandlordDashboardController';
import { BrokerDashboardController } from '../controllers/BrokerDashboardController';
import { UserRole } from '../types';

const router = Router();
const roleGuard = new RoleGuardMiddleware();
const profileGuard = new ProfileCompletionGuard();
const dashboardController = new DashboardController();
const landlordDashboardController = new LandlordDashboardController();
const brokerDashboardController = new BrokerDashboardController();

/**
 * Extended Request interface with authenticated user data
 */
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * GET /api/dashboard/tenant
 * Get tenant dashboard data with KPIs and businesses
 *
 * Request headers:
 * - Authorization: Bearer <accessToken>
 *
 * Response (200):
 * {
 *   success: true,
 *   data: {
 *     kpis: {
 *       activeBusinesses: number,
 *       responseRate: string,  // e.g., "75.5%"
 *       landlordViews: number,
 *       messagesTotal: number
 *     },
 *     businesses: Business[],
 *     total: number
 *   }
 * }
 *
 * Errors:
 * - 401: Unauthorized
 * - 403: Forbidden (wrong role or profile incomplete)
 * - 500: Internal server error
 */
router.get(
  '/tenant',
  roleGuard.requireTenant(),
  profileGuard.check(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      // Get dashboard data
      const dashboardData = await dashboardController.getTenantDashboard(userId);

      res.status(200).json({
        success: true,
        data: dashboardData,
      });
    } catch (error: any) {
      console.error('Tenant dashboard error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred loading dashboard',
        },
      });
    }
  }
);

/**
 * GET /api/dashboard/tenant/kpis
 * Get only KPIs without businesses list
 * Useful for polling updates
 *
 * Request headers:
 * - Authorization: Bearer <accessToken>
 *
 * Response (200):
 * {
 *   success: true,
 *   data: {
 *     activeBusinesses: number,
 *     responseRate: string,  // e.g., "75.5%"
 *     landlordViews: number,
 *     messagesTotal: number
 *   }
 * }
 *
 * Errors:
 * - 401: Unauthorized
 * - 403: Forbidden (wrong role or profile incomplete)
 * - 500: Internal server error
 */
router.get(
  '/tenant/kpis',
  roleGuard.requireTenant(),
  profileGuard.check(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      // Get KPIs only
      const kpis = await dashboardController.getKPIsOnly(userId);

      res.status(200).json({
        success: true,
        data: kpis,
      });
    } catch (error: any) {
      console.error('Get KPIs error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred loading KPIs',
        },
      });
    }
  }
);

/**
 * GET /api/dashboard/landlord/kpis
 * Get only KPIs for landlord dashboard without properties list
 * Useful for polling updates
 *
 * Request headers:
 * - Authorization: Bearer <accessToken>
 *
 * Response (200):
 * {
 *   success: true,
 *   data: {
 *     totalListings: { value: number, trend: { value: number, direction: string, period: string } },
 *     activeListings: { value: number, trend: { ... } },
 *     avgDaysOnMarket: { value: number, trend: { ... } },
 *     responseRate: { value: number, trend: { ... } }
 *   }
 * }
 *
 * Errors:
 * - 401: Unauthorized
 * - 403: Forbidden (not a landlord)
 * - 500: Internal server error
 */
router.get(
  '/landlord/kpis',
  roleGuard.requireLandlord(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      // Get KPIs only
      const kpis = await landlordDashboardController.getKPIs(userId);

      res.status(200).json({
        success: true,
        data: kpis,
      });
    } catch (error: any) {
      console.error('Get landlord KPIs error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred loading KPIs',
        },
      });
    }
  }
);

/**
 * GET /api/dashboard/landlord
 * Get full landlord dashboard data with KPIs and property listings
 *
 * Request headers:
 * - Authorization: Bearer <accessToken>
 *
 * Query parameters:
 * - page?: number (default: 1)
 * - limit?: number (default: 20)
 *
 * Response (200):
 * {
 *   success: true,
 *   data: {
 *     kpis: {
 *       totalListings: { value: number, trend: { value: number, direction: string, period: string } },
 *       activeListings: { value: number, trend: { ... } },
 *       avgDaysOnMarket: { value: number, trend: { ... } },
 *       responseRate: { value: number, trend: { ... } }
 *     },
 *     properties: PropertyListing[],
 *     total: number,
 *     hasMore: boolean
 *   }
 * }
 *
 * Errors:
 * - 401: Unauthorized
 * - 403: Forbidden (not a landlord)
 * - 500: Internal server error
 */
router.get(
  '/landlord',
  roleGuard.requireLandlord(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      // Parse pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      // Validate pagination parameters
      const validatedPage = Math.max(1, page);
      const validatedLimit = Math.min(100, Math.max(1, limit)); // Max 100 per page

      // Get full dashboard data
      const dashboardData = await landlordDashboardController.getDashboardData(
        userId,
        validatedPage,
        validatedLimit
      );

      res.status(200).json({
        success: true,
        data: dashboardData,
      });
    } catch (error: any) {
      console.error('Landlord dashboard error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred loading dashboard',
        },
      });
    }
  }
);

/**
 * GET /api/dashboard/broker/kpis
 * Get only KPIs for broker dashboard
 * Useful for polling updates
 *
 * Request headers:
 * - Authorization: Bearer <accessToken>
 *
 * Response (200):
 * {
 *   success: true,
 *   data: {
 *     activeDeals: { value: number, trend: { value: number, direction: string, period: string } },
 *     commissionPipeline: { value: number, trend: { ... } },
 *     responseRate: { value: number, trend: { ... } },
 *     propertiesMatched: { value: number, trend: { ... } }
 *   }
 * }
 *
 * Errors:
 * - 401: Unauthorized
 * - 403: Forbidden (not a broker)
 * - 500: Internal server error
 */
router.get(
  '/broker/kpis',
  roleGuard.requireBroker(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      // Get KPIs only
      const kpis = await brokerDashboardController.getKPIs(userId);

      res.status(200).json({
        success: true,
        data: kpis,
      });
    } catch (error: any) {
      console.error('Get broker KPIs error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred loading KPIs',
        },
      });
    }
  }
);

/**
 * GET /api/dashboard/broker
 * Get broker dashboard data
 *
 * Request headers:
 * - Authorization: Bearer <accessToken>
 *
 * Response (200):
 * {
 *   dashboard: {
 *     role: 'broker',
 *     features: string[],
 *     redirectPath: '/dashboard/broker'
 *   }
 * }
 *
 * Errors:
 * - 401: Unauthorized
 * - 403: Forbidden (wrong role)
 */
router.get(
  '/broker',
  roleGuard.requireBroker(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user;

      res.status(200).json({
        dashboard: {
          role: UserRole.BROKER,
          user: {
            id: user?.userId,
            email: user?.email,
            role: user?.role,
          },
          features: [
            'represent_tenants',
            'represent_landlords',
            'dual_mode_access',
            'manage_broker_profile',
            'view_all_listings',
          ],
          redirectPath: '/dashboard/broker',
          welcomeMessage: 'Welcome to your Broker Dashboard',
        },
      });
    } catch (error: any) {
      console.error('Broker dashboard error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred loading dashboard',
        },
      });
    }
  }
);

/**
 * GET /api/dashboard
 * Get dashboard redirect path based on user role
 *
 * Request headers:
 * - Authorization: Bearer <accessToken>
 *
 * Response (200):
 * {
 *   redirectPath: string,
 *   role: string
 * }
 *
 * Errors:
 * - 401: Unauthorized
 */
router.get(
  '/',
  roleGuard.authenticate(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user;

      // Determine redirect path based on role
      let redirectPath: string;
      switch (user?.role) {
        case UserRole.TENANT:
          redirectPath = '/dashboard/tenant';
          break;
        case UserRole.LANDLORD:
          redirectPath = '/dashboard/landlord';
          break;
        case UserRole.BROKER:
          redirectPath = '/dashboard/broker';
          break;
        default:
          redirectPath = '/dashboard/tenant'; // Default fallback
      }

      res.status(200).json({
        redirectPath,
        role: user?.role,
        user: {
          id: user?.userId,
          email: user?.email,
        },
      });
    } catch (error: any) {
      console.error('Dashboard redirect error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred determining dashboard route',
        },
      });
    }
  }
);

export default router;
