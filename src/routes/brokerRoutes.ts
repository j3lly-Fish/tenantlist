import { Router, Request, Response } from 'express';
import { RoleGuardMiddleware } from '../middleware/roleGuardMiddleware';
import { BrokerDashboardController } from '../controllers/BrokerDashboardController';

const router = Router();
const roleGuard = new RoleGuardMiddleware();
const brokerController = new BrokerDashboardController();

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
 * GET /api/broker/profile
 * Get broker profile for authenticated user
 *
 * Request headers:
 * - Authorization: Bearer <accessToken>
 *
 * Response (200):
 * {
 *   success: true,
 *   data: BrokerProfile | null
 * }
 *
 * Errors:
 * - 401: Unauthorized
 * - 403: Forbidden (not a broker)
 * - 500: Internal server error
 */
router.get(
  '/profile',
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

      const profile = await brokerController.getBrokerProfile(userId);

      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      console.error('Get broker profile error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred loading broker profile',
        },
      });
    }
  }
);

/**
 * POST /api/broker/profile
 * Create broker profile for authenticated user
 *
 * Request headers:
 * - Authorization: Bearer <accessToken>
 *
 * Request body:
 * {
 *   company_name: string,
 *   license_number?: string,
 *   license_state?: string,
 *   specialties?: string[],
 *   bio?: string,
 *   website_url?: string,
 *   years_experience?: number
 * }
 *
 * Response (201):
 * {
 *   success: true,
 *   data: BrokerProfile
 * }
 *
 * Errors:
 * - 400: Bad request (missing required fields)
 * - 401: Unauthorized
 * - 403: Forbidden (not a broker)
 * - 500: Internal server error
 */
router.post(
  '/profile',
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

      // Validate required fields
      if (!req.body.company_name) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'company_name is required',
          },
        });
      }

      const profile = await brokerController.createBrokerProfile(userId, req.body);

      res.status(201).json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      console.error('Create broker profile error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred creating broker profile',
        },
      });
    }
  }
);

/**
 * PUT /api/broker/profile
 * Update broker profile for authenticated user
 *
 * Request headers:
 * - Authorization: Bearer <accessToken>
 *
 * Request body:
 * Partial<BrokerProfile>
 *
 * Response (200):
 * {
 *   success: true,
 *   data: BrokerProfile | null
 * }
 *
 * Errors:
 * - 401: Unauthorized
 * - 403: Forbidden (not a broker)
 * - 404: Not found (profile doesn't exist)
 * - 500: Internal server error
 */
router.put(
  '/profile',
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

      const profile = await brokerController.updateBrokerProfile(userId, req.body);

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Broker profile not found',
          },
        });
      }

      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      console.error('Update broker profile error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred updating broker profile',
        },
      });
    }
  }
);

/**
 * GET /api/broker/demands
 * Get paginated tenant demands for broker to browse
 *
 * Request headers:
 * - Authorization: Bearer <accessToken>
 *
 * Query parameters:
 * - page?: number (default: 1)
 * - limit?: number (default: 20)
 * - location?: string
 * - propertyType?: string
 * - minSqft?: number
 * - maxSqft?: number
 *
 * Response (200):
 * {
 *   success: true,
 *   data: {
 *     demands: DemandListing[],
 *     total: number,
 *     hasMore: boolean
 *   }
 * }
 *
 * Errors:
 * - 401: Unauthorized
 * - 403: Forbidden (not a broker)
 * - 500: Internal server error
 */
router.get(
  '/demands',
  roleGuard.requireBroker(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const params = {
        page: parseInt(req.query.page as string) || 1,
        limit: Math.min(100, parseInt(req.query.limit as string) || 20),
        location: req.query.location as string,
        propertyType: req.query.propertyType as string,
        minSqft: req.query.minSqft ? parseInt(req.query.minSqft as string) : undefined,
        maxSqft: req.query.maxSqft ? parseInt(req.query.maxSqft as string) : undefined,
      };

      const result = await brokerController.getTenantDemands(params);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Get tenant demands error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred loading tenant demands',
        },
      });
    }
  }
);

/**
 * GET /api/broker/properties
 * Get paginated property listings for broker to browse
 *
 * Request headers:
 * - Authorization: Bearer <accessToken>
 *
 * Query parameters:
 * - page?: number (default: 1)
 * - limit?: number (default: 20)
 * - location?: string
 * - propertyType?: string
 * - minSqft?: number
 * - maxSqft?: number
 *
 * Response (200):
 * {
 *   success: true,
 *   data: {
 *     properties: PropertyListing[],
 *     total: number,
 *     hasMore: boolean
 *   }
 * }
 *
 * Errors:
 * - 401: Unauthorized
 * - 403: Forbidden (not a broker)
 * - 500: Internal server error
 */
router.get(
  '/properties',
  roleGuard.requireBroker(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const params = {
        page: parseInt(req.query.page as string) || 1,
        limit: Math.min(100, parseInt(req.query.limit as string) || 20),
        location: req.query.location as string,
        propertyType: req.query.propertyType as any,
        minSqft: req.query.minSqft ? parseInt(req.query.minSqft as string) : undefined,
        maxSqft: req.query.maxSqft ? parseInt(req.query.maxSqft as string) : undefined,
      };

      const result = await brokerController.getProperties(params);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Get properties error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred loading properties',
        },
      });
    }
  }
);

/**
 * GET /api/broker/deals
 * Get broker's deals with pagination
 *
 * Request headers:
 * - Authorization: Bearer <accessToken>
 *
 * Query parameters:
 * - page?: number (default: 1)
 * - limit?: number (default: 20)
 * - status?: string (prospecting|touring|offer_submitted|signed|lost)
 *
 * Response (200):
 * {
 *   success: true,
 *   data: {
 *     deals: BrokerDeal[],
 *     total: number,
 *     hasMore: boolean
 *   }
 * }
 *
 * Errors:
 * - 401: Unauthorized
 * - 403: Forbidden (not a broker)
 * - 500: Internal server error
 */
router.get(
  '/deals',
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

      const params = {
        page: parseInt(req.query.page as string) || 1,
        limit: Math.min(100, parseInt(req.query.limit as string) || 20),
        status: req.query.status as any,
      };

      const result = await brokerController.getDeals(userId, params);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Get broker deals error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred loading broker deals',
        },
      });
    }
  }
);

export default router;
