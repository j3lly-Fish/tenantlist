import { Router, Request, Response } from 'express';
import { RoleGuardMiddleware } from '../middleware/roleGuardMiddleware';
import { ProfileCompletionGuard } from '../middleware/ProfileCompletionGuard';
import { DashboardController } from '../controllers/DashboardController';
import { UserRole } from '../types';

const router = Router();
const roleGuard = new RoleGuardMiddleware();
const profileGuard = new ProfileCompletionGuard();
const dashboardController = new DashboardController();

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
 * GET /api/dashboard/landlord
 * Get landlord dashboard data
 *
 * Request headers:
 * - Authorization: Bearer <accessToken>
 *
 * Response (200):
 * {
 *   dashboard: {
 *     role: 'landlord',
 *     features: string[],
 *     redirectPath: '/dashboard/landlord'
 *   }
 * }
 *
 * Errors:
 * - 401: Unauthorized
 * - 403: Forbidden (wrong role)
 */
router.get(
  '/landlord',
  roleGuard.requireLandlord(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user;

      res.status(200).json({
        dashboard: {
          role: UserRole.LANDLORD,
          user: {
            id: user?.userId,
            email: user?.email,
            role: user?.role,
          },
          features: [
            'manage_properties',
            'view_tenant_requirements',
            'submit_proposals',
            'manage_landlord_profile',
          ],
          redirectPath: '/dashboard/landlord',
          welcomeMessage: 'Welcome to your Landlord Dashboard',
        },
      });
    } catch (error: any) {
      console.error('Landlord dashboard error:', error);
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
