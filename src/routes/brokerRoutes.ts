import { Router, Request, Response } from 'express';
import { RoleGuardMiddleware } from '../middleware/roleGuardMiddleware';
import { BrokerDashboardController } from '../controllers/BrokerDashboardController';
import { BusinessProfileController } from '../controllers/BusinessProfileController';
import { TenantProfileController } from '../controllers/TenantProfileController';
import { BrokerLocationController } from '../controllers/BrokerLocationController';

const router = Router();
const roleGuard = new RoleGuardMiddleware();
const brokerController = new BrokerDashboardController();
const businessProfileController = new BusinessProfileController();
const tenantProfileController = new TenantProfileController();
const locationController = new BrokerLocationController();

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

// ============================================================================
// EXISTING BROKER ROUTES (Legacy)
// ============================================================================

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

// ============================================================================
// NEW BUSINESS PROFILE ENDPOINTS (Figma Redesign)
// ============================================================================

/**
 * POST /api/broker/business-profiles
 * Create brokerage profile
 *
 * Request headers:
 * - Authorization: Bearer <accessToken>
 *
 * Request body:
 * {
 *   company_name: string (required),
 *   logo_url?: string,
 *   cover_image_url?: string,
 *   established_year?: number,
 *   location_city?: string,
 *   location_state?: string,
 *   about?: string,
 *   website_url?: string,
 *   instagram_url?: string,
 *   linkedin_url?: string
 * }
 *
 * Response (201):
 * {
 *   success: true,
 *   data: BusinessProfile with stats
 * }
 *
 * Errors:
 * - 400: Bad request (missing required fields or invalid data)
 * - 401: Unauthorized
 * - 403: Forbidden (not a broker)
 * - 500: Internal server error
 */
router.post(
  '/business-profiles',
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

      const profile = await businessProfileController.createBusinessProfile(userId, req.body);

      res.status(201).json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      console.error('Create business profile error:', error);

      if (error.message.includes('required') || error.message.includes('must be')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: error.message,
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred creating business profile',
        },
      });
    }
  }
);

/**
 * GET /api/broker/business-profiles
 * List user's business profiles
 *
 * Request headers:
 * - Authorization: Bearer <accessToken>
 *
 * Response (200):
 * {
 *   success: true,
 *   data: {
 *     profiles: BusinessProfile[],
 *     total: number
 *   }
 * }
 *
 * Errors:
 * - 401: Unauthorized
 * - 403: Forbidden (not a broker)
 * - 500: Internal server error
 */
router.get(
  '/business-profiles',
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

      const result = await businessProfileController.getBusinessProfiles(userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Get business profiles error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred loading business profiles',
        },
      });
    }
  }
);

/**
 * GET /api/broker/business-profiles/:id
 * Get specific profile with team members
 *
 * Request headers:
 * - Authorization: Bearer <accessToken>
 *
 * Response (200):
 * {
 *   success: true,
 *   data: BusinessProfile with team_members array
 * }
 *
 * Errors:
 * - 401: Unauthorized
 * - 403: Forbidden (not a broker or not owner)
 * - 404: Not found
 * - 500: Internal server error
 */
router.get(
  '/business-profiles/:id',
  roleGuard.requireBroker(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const profileId = req.params.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      const profile = await businessProfileController.getBusinessProfileById(profileId, userId);

      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      console.error('Get business profile by ID error:', error);

      if (error.message === 'Business profile not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
        });
      }

      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: error.message,
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred loading business profile',
        },
      });
    }
  }
);

/**
 * PUT /api/broker/business-profiles/:id
 * Update profile
 *
 * Request headers:
 * - Authorization: Bearer <accessToken>
 *
 * Request body:
 * Partial<BusinessProfile>
 *
 * Response (200):
 * {
 *   success: true,
 *   data: Updated BusinessProfile
 * }
 *
 * Errors:
 * - 400: Bad request (invalid data)
 * - 401: Unauthorized
 * - 403: Forbidden (not owner)
 * - 404: Not found
 * - 500: Internal server error
 */
router.put(
  '/business-profiles/:id',
  roleGuard.requireBroker(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const profileId = req.params.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      const profile = await businessProfileController.updateBusinessProfile(
        profileId,
        userId,
        req.body
      );

      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      console.error('Update business profile error:', error);

      if (error.message === 'Business profile not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
        });
      }

      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: error.message,
          },
        });
      }

      if (error.message.includes('must be')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: error.message,
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred updating business profile',
        },
      });
    }
  }
);

/**
 * DELETE /api/broker/business-profiles/:id
 * Delete profile
 *
 * Request headers:
 * - Authorization: Bearer <accessToken>
 *
 * Response (200):
 * {
 *   success: true,
 *   data: { success: true }
 * }
 *
 * Errors:
 * - 401: Unauthorized
 * - 403: Forbidden (not owner)
 * - 404: Not found
 * - 500: Internal server error
 */
router.delete(
  '/business-profiles/:id',
  roleGuard.requireBroker(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const profileId = req.params.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      const result = await businessProfileController.deleteBusinessProfile(profileId, userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Delete business profile error:', error);

      if (error.message === 'Business profile not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
        });
      }

      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: error.message,
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred deleting business profile',
        },
      });
    }
  }
);

/**
 * POST /api/broker/business-profiles/:id/team
 * Add team member
 *
 * Request headers:
 * - Authorization: Bearer <accessToken>
 *
 * Request body:
 * {
 *   user_id?: string,
 *   email?: string,
 *   role: 'broker' | 'manager' | 'admin' | 'viewer'
 * }
 *
 * Response (201):
 * {
 *   success: true,
 *   data: Created team member
 * }
 *
 * Errors:
 * - 400: Bad request (missing required fields or invalid role)
 * - 401: Unauthorized
 * - 403: Forbidden (not owner)
 * - 404: Not found
 * - 500: Internal server error
 */
router.post(
  '/business-profiles/:id/team',
  roleGuard.requireBroker(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const profileId = req.params.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      const teamMember = await businessProfileController.addTeamMember(
        profileId,
        userId,
        req.body
      );

      res.status(201).json({
        success: true,
        data: teamMember,
      });
    } catch (error: any) {
      console.error('Add team member error:', error);

      if (error.message === 'Business profile not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
        });
      }

      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: error.message,
          },
        });
      }

      if (
        error.message.includes('required') ||
        error.message.includes('Invalid') ||
        error.message.includes('already exists')
      ) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: error.message,
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred adding team member',
        },
      });
    }
  }
);

/**
 * DELETE /api/broker/business-profiles/:id/team/:memberId
 * Remove team member
 *
 * Request headers:
 * - Authorization: Bearer <accessToken>
 *
 * Response (200):
 * {
 *   success: true,
 *   data: { success: true }
 * }
 *
 * Errors:
 * - 401: Unauthorized
 * - 403: Forbidden (not owner)
 * - 404: Not found
 * - 500: Internal server error
 */
router.delete(
  '/business-profiles/:id/team/:memberId',
  roleGuard.requireBroker(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const profileId = req.params.id;
      const memberId = req.params.memberId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      const result = await businessProfileController.removeTeamMember(
        profileId,
        memberId,
        userId
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Remove team member error:', error);

      if (error.message === 'Business profile not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
        });
      }

      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: error.message,
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred removing team member',
        },
      });
    }
  }
);

/**
 * GET /api/broker/business-profiles/:id/stats
 * Get calculated stats
 *
 * Request headers:
 * - Authorization: Bearer <accessToken>
 *
 * Response (200):
 * {
 *   success: true,
 *   data: BusinessProfileStats
 * }
 *
 * Errors:
 * - 401: Unauthorized
 * - 403: Forbidden (not owner)
 * - 404: Not found
 * - 500: Internal server error
 */
router.get(
  '/business-profiles/:id/stats',
  roleGuard.requireBroker(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const profileId = req.params.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      const stats = await businessProfileController.getBusinessProfileStats(profileId, userId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Get business profile stats error:', error);

      if (error.message === 'Business profile not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
        });
      }

      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: error.message,
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred loading business stats',
        },
      });
    }
  }
);

// ============================================================================
// TENANT PUBLIC PROFILE ENDPOINTS (Figma Redesign)
// ============================================================================

/**
 * GET /api/broker/tenants
 * Search public tenant profiles
 *
 * Request headers:
 * - Authorization: Bearer <accessToken>
 *
 * Query parameters:
 * - search?: string
 * - category?: string
 * - location?: string
 * - page?: number (default: 1)
 * - limit?: number (default: 20, max: 100)
 *
 * Response (200):
 * {
 *   success: true,
 *   data: {
 *     profiles: TenantPublicProfile[],
 *     total: number,
 *     page: number,
 *     limit: number,
 *     totalPages: number
 *   }
 * }
 *
 * Errors:
 * - 401: Unauthorized
 * - 403: Forbidden (not a broker)
 * - 500: Internal server error
 */
router.get(
  '/tenants',
  roleGuard.requireBroker(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const filters = {
        search: req.query.search as string,
        category: req.query.category as string,
        location: req.query.location as string,
        page: parseInt(req.query.page as string) || 1,
        limit: Math.min(100, parseInt(req.query.limit as string) || 20),
      };

      const result = await tenantProfileController.searchTenantProfiles(filters);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Search tenant profiles error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred searching tenant profiles',
        },
      });
    }
  }
);

/**
 * GET /api/broker/tenants/:id
 * Get full tenant profile with images, documents, locations
 *
 * Request headers:
 * - Authorization: Bearer <accessToken>
 *
 * Response (200):
 * {
 *   success: true,
 *   data: TenantPublicProfile with embedded images, documents, locations
 * }
 *
 * Errors:
 * - 401: Unauthorized
 * - 403: Forbidden (not a broker)
 * - 404: Not found
 * - 500: Internal server error
 */
router.get(
  '/tenants/:id',
  roleGuard.requireBroker(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.params.id;

      const profile = await tenantProfileController.getTenantProfile(tenantId);

      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      console.error('Get tenant profile error:', error);

      if (error.message === 'Tenant profile not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred loading tenant profile',
        },
      });
    }
  }
);

/**
 * POST /api/broker/tenants/:id/request
 * Request admin approval
 *
 * Request headers:
 * - Authorization: Bearer <accessToken>
 *
 * Request body:
 * {
 *   tenant_email: string,
 *   tenant_pin: string,
 *   business_profile_id: string
 * }
 *
 * Response (201):
 * {
 *   success: true,
 *   data: {
 *     requestId: string,
 *     status: 'pending',
 *     message: string
 *   }
 * }
 *
 * Errors:
 * - 400: Bad request (missing required fields or invalid data)
 * - 401: Unauthorized
 * - 403: Forbidden (not a broker)
 * - 404: Not found (tenant profile not found)
 * - 500: Internal server error
 */
router.post(
  '/tenants/:id/request',
  roleGuard.requireBroker(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const tenantId = req.params.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      // Validate required field
      if (!req.body.business_profile_id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'business_profile_id is required',
          },
        });
      }

      const result = await tenantProfileController.requestAdminApproval(
        tenantId,
        userId,
        req.body.business_profile_id,
        {
          tenant_email: req.body.tenant_email,
          tenant_pin: req.body.tenant_pin,
        }
      );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Request admin approval error:', error);

      if (error.message === 'Tenant profile not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
        });
      }

      if (
        error.message.includes('required') ||
        error.message.includes('Invalid') ||
        error.message.includes('already')
      ) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: error.message,
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred submitting approval request',
        },
      });
    }
  }
);

/**
 * POST /api/broker/tenants/:id/contact
 * Send message to tenant
 *
 * Request headers:
 * - Authorization: Bearer <accessToken>
 *
 * Request body:
 * {
 *   message: string,
 *   subject: string
 * }
 *
 * Response (200):
 * {
 *   success: true,
 *   data: {
 *     success: true,
 *     message: 'Message sent successfully'
 *   }
 * }
 *
 * Errors:
 * - 400: Bad request (missing required fields)
 * - 401: Unauthorized
 * - 403: Forbidden (not a broker)
 * - 404: Not found (tenant profile not found)
 * - 500: Internal server error
 */
router.post(
  '/tenants/:id/contact',
  roleGuard.requireBroker(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const tenantId = req.params.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      const result = await tenantProfileController.contactTenant(tenantId, userId, {
        message: req.body.message,
        subject: req.body.subject,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Contact tenant error:', error);

      if (error.message === 'Tenant profile not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
        });
      }

      if (error.message.includes('required')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: error.message,
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred sending message',
        },
      });
    }
  }
);

// ============================================================================
// LOCATION/DEMAND LISTING ENDPOINTS (Figma Redesign)
// ============================================================================

/**
 * POST /api/broker/locations
 * Post new space requirement with amenities
 *
 * Request headers:
 * - Authorization: Bearer <accessToken>
 *
 * Request body:
 * {
 *   business_profile_id: string,
 *   location_name: string,
 *   asset_type: string,
 *   city: string,
 *   state: string,
 *   target_move_in?: string,
 *   sqft_min?: number,
 *   sqft_max?: number,
 *   lot_size_min?: number,
 *   lot_size_max?: number,
 *   monthly_budget_min?: number,
 *   monthly_budget_max?: number,
 *   preferred_lease_term?: string,
 *   locations_of_interest?: any[],
 *   amenities?: string[],
 *   map_boundaries?: object
 * }
 *
 * Response (201):
 * {
 *   success: true,
 *   data: Created demand listing
 * }
 *
 * Errors:
 * - 400: Bad request (missing required fields or invalid data)
 * - 401: Unauthorized
 * - 403: Forbidden (not a broker)
 * - 500: Internal server error
 */
router.post(
  '/locations',
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

      // Validate required field
      if (!req.body.business_profile_id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'business_profile_id is required',
          },
        });
      }

      const location = await locationController.createLocation(
        req.body.business_profile_id,
        req.body
      );

      res.status(201).json({
        success: true,
        data: location,
      });
    } catch (error: any) {
      console.error('Create location error:', error);

      if (
        error.message.includes('required') ||
        error.message.includes('cannot be greater') ||
        error.message.includes('must be')
      ) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: error.message,
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred creating location',
        },
      });
    }
  }
);

/**
 * PUT /api/broker/locations/:id
 * Update location requirement
 *
 * Request headers:
 * - Authorization: Bearer <accessToken>
 *
 * Request body:
 * Partial<DemandListing>
 *
 * Response (200):
 * {
 *   success: true,
 *   data: Updated demand listing
 * }
 *
 * Errors:
 * - 400: Bad request (invalid data)
 * - 401: Unauthorized
 * - 403: Forbidden (not owner)
 * - 404: Not found
 * - 500: Internal server error
 */
router.put(
  '/locations/:id',
  roleGuard.requireBroker(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const locationId = req.params.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      // Note: In a real implementation, we'd get business_profile_id from the existing location
      // or from request context. For now, we'll pass userId as brokerId for authorization.
      // TODO: Implement proper business profile ID resolution
      const location = await locationController.updateLocation(
        locationId,
        userId, // This should be business_profile_id, but using userId for now
        req.body
      );

      res.status(200).json({
        success: true,
        data: location,
      });
    } catch (error: any) {
      console.error('Update location error:', error);

      if (error.message === 'Location not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
        });
      }

      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: error.message,
          },
        });
      }

      if (error.message.includes('cannot be greater')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: error.message,
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred updating location',
        },
      });
    }
  }
);

/**
 * GET /api/broker/locations
 * List broker's posted locations with pagination
 *
 * Request headers:
 * - Authorization: Bearer <accessToken>
 *
 * Query parameters:
 * - business_profile_id: string (required)
 * - page?: number (default: 1)
 * - limit?: number (default: 20, max: 100)
 *
 * Response (200):
 * {
 *   success: true,
 *   data: {
 *     locations: DemandListing[],
 *     total: number,
 *     page: number,
 *     limit: number,
 *     hasMore: boolean
 *   }
 * }
 *
 * Errors:
 * - 400: Bad request (missing business_profile_id)
 * - 401: Unauthorized
 * - 403: Forbidden (not a broker)
 * - 500: Internal server error
 */
router.get(
  '/locations',
  roleGuard.requireBroker(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const businessProfileId = req.query.business_profile_id as string;

      if (!businessProfileId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'business_profile_id is required',
          },
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(100, parseInt(req.query.limit as string) || 20);

      const result = await locationController.getLocations(businessProfileId, page, limit);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Get locations error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred loading locations',
        },
      });
    }
  }
);

export default router;
