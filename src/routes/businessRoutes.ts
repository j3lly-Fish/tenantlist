import { Router, Request, Response } from 'express';
import { BusinessController } from '../controllers/BusinessController';
import { RoleGuardMiddleware } from '../middleware/roleGuardMiddleware';
import { UserRole, BusinessStatus } from '../types';

const router = Router();
const businessController = new BusinessController();
const roleGuard = new RoleGuardMiddleware();

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
 * POST /api/businesses
 * Create a new business for authenticated tenant user
 *
 * Request body:
 * {
 *   name: string (required),
 *   category: string (required),
 *   logo_url?: string | null,
 *   status?: 'active' | 'pending_verification' | 'stealth_mode'
 * }
 *
 * Response (201):
 * {
 *   success: true,
 *   data: {
 *     business: Business
 *   }
 * }
 *
 * Errors:
 * - 400: Validation error (missing required fields)
 * - 401: Unauthorized (no token or invalid token)
 * - 403: Forbidden (non-tenant role)
 * - 500: Internal server error
 */
router.post(
  '/',
  roleGuard.requireTenant(),
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

      const { name, category, logo_url, status } = req.body;

      // Create business
      const business = await businessController.createBusiness(userId, {
        name,
        category,
        logo_url,
        status,
      });

      res.status(201).json({
        success: true,
        data: {
          business,
        },
      });
    } catch (error: any) {
      console.error('Create business error:', error);

      if (error.message.includes('required')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while creating the business',
        },
      });
    }
  }
);

/**
 * GET /api/businesses
 * List businesses for authenticated tenant user
 *
 * Query parameters:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - status: 'active' | 'pending_verification' | 'stealth_mode'
 * - search: string (search by business name)
 *
 * Response (200):
 * {
 *   success: true,
 *   data: {
 *     businesses: Business[],
 *     total: number,
 *     page: number,
 *     limit: number,
 *     hasMore: boolean
 *   }
 * }
 *
 * Errors:
 * - 401: Unauthorized (no token or invalid token)
 * - 403: Forbidden (non-tenant role)
 * - 500: Internal server error
 */
router.get(
  '/',
  roleGuard.requireTenant(),
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

      // Parse query parameters
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const status = req.query.status as BusinessStatus | undefined;
      const search = req.query.search as string | undefined;

      // Validate status if provided
      if (status && !Object.values(BusinessStatus).includes(status)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid status value',
          },
        });
      }

      // Get businesses
      const result = await businessController.listBusinesses(userId, {
        page,
        limit,
        status,
        search,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('List businesses error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching businesses',
        },
      });
    }
  }
);

/**
 * GET /api/businesses/:id
 * Get single business with details, demand listings, and aggregated counts
 *
 * Path parameters:
 * - id: Business UUID
 *
 * Response (200):
 * {
 *   success: true,
 *   data: {
 *     business: Business,
 *     demandListings: DemandListing[],
 *     listingsCount: number,
 *     statesCount: number,
 *     invitesCount: number
 *   }
 * }
 *
 * Errors:
 * - 401: Unauthorized
 * - 403: Forbidden (user doesn't own the business)
 * - 404: Business not found
 * - 500: Internal server error
 */
router.get(
  '/:id',
  roleGuard.requireTenant(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const businessId = req.params.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      // Get business details
      const result = await businessController.getBusinessById(businessId, userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Get business error:', error);

      if (error.message === 'Business not found') {
        return res.status(404).json({
          success: false,
          error: 'Business not found',
        });
      }

      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access this business',
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching business details',
        },
      });
    }
  }
);

/**
 * GET /api/businesses/:id/demand-listings
 * List all demand listings for a business
 *
 * Path parameters:
 * - id: Business UUID
 *
 * Response (200):
 * {
 *   success: true,
 *   data: {
 *     demandListings: DemandListing[],
 *     total: number
 *   }
 * }
 *
 * Errors:
 * - 401: Unauthorized
 * - 403: Forbidden (user doesn't own the business)
 * - 404: Business not found
 * - 500: Internal server error
 */
router.get(
  '/:id/demand-listings',
  roleGuard.requireTenant(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const businessId = req.params.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      // Get demand listings
      const result = await businessController.listDemandListings(businessId, userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('List demand listings error:', error);

      if (error.message === 'Business not found') {
        return res.status(404).json({
          success: false,
          error: 'Business not found',
        });
      }

      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access this business',
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching demand listings',
        },
      });
    }
  }
);

/**
 * GET /api/businesses/:id/locations/:locationId/metrics
 * Get metrics for a specific demand listing location (PLACEHOLDER for MVP)
 *
 * Path parameters:
 * - id: Business UUID
 * - locationId: Demand Listing UUID
 *
 * Response (200):
 * {
 *   success: true,
 *   data: {
 *     message: "Feature coming soon",
 *     metrics: {
 *       views: "N/A",
 *       clicks: "N/A",
 *       invites: "N/A",
 *       declined: "N/A",
 *       messages: "N/A",
 *       qfps: "N/A"
 *     }
 *   }
 * }
 *
 * Errors:
 * - 401: Unauthorized
 * - 403: Forbidden (user doesn't own the business)
 * - 404: Business or location not found
 * - 500: Internal server error
 */
router.get(
  '/:id/locations/:locationId/metrics',
  roleGuard.requireTenant(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const businessId = req.params.id;
      const locationId = req.params.locationId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      // Get location metrics (placeholder)
      const result = await businessController.getLocationMetrics(
        businessId,
        locationId,
        userId
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Get location metrics error:', error);

      if (
        error.message === 'Business not found' ||
        error.message === 'Location not found'
      ) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      if (
        error.message.includes('Unauthorized') ||
        error.message.includes('does not belong')
      ) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access this resource',
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching location metrics',
        },
      });
    }
  }
);

/**
 * GET /api/businesses/:id/metrics
 * Get aggregated metrics for a business
 *
 * Path parameters:
 * - id: Business UUID
 *
 * Response (200):
 * {
 *   success: true,
 *   data: {
 *     totalViews: number,
 *     totalClicks: number,
 *     totalInvites: number,
 *     totalMessages: number,
 *     totalDeclined: number,
 *     totalQfps: number,
 *     metricsHistory: BusinessMetrics[]
 *   }
 * }
 */
router.get(
  '/:id/metrics',
  roleGuard.requireTenant(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const businessId = req.params.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      const result = await businessController.getBusinessMetrics(businessId, userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Get business metrics error:', error);

      if (error.message === 'Business not found') {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access this resource',
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching business metrics',
        },
      });
    }
  }
);

/**
 * POST /api/demand-listings
 * Create a new demand listing for a business
 *
 * Request body:
 * {
 *   business_id: string (required),
 *   title?: string,
 *   description?: string,
 *   location_name: string (required),
 *   city: string (required),
 *   state: string (required),
 *   address?: string,
 *   sqft_min?: number,
 *   sqft_max?: number,
 *   budget_min?: number,
 *   budget_max?: number,
 *   duration_type?: string,
 *   start_date?: string,
 *   industry?: string,
 *   asset_type: string (required)
 * }
 *
 * Response (201):
 * {
 *   success: true,
 *   data: {
 *     demandListing: DemandListing
 *   }
 * }
 *
 * Errors:
 * - 400: Validation error (missing required fields)
 * - 401: Unauthorized
 * - 403: Forbidden (user doesn't own the business)
 * - 404: Business not found
 * - 500: Internal server error
 */
router.post(
  '/:id/demand-listings',
  roleGuard.requireTenant(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const businessId = req.params.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      const {
        title,
        description,
        location_name,
        city,
        state,
        address,
        sqft_min,
        sqft_max,
        budget_min,
        budget_max,
        duration_type,
        start_date,
        industry,
        asset_type,
        lot_size,
        is_corporate_location,
        additional_features,
        stealth_mode,
      } = req.body;

      // Create demand listing
      const demandListing = await businessController.createDemandListing(userId, {
        business_id: businessId,
        title,
        description,
        location_name,
        city,
        state,
        address,
        sqft_min,
        sqft_max,
        budget_min,
        budget_max,
        duration_type,
        start_date,
        industry,
        asset_type,
        lot_size,
        is_corporate_location,
        additional_features,
        stealth_mode,
      });

      res.status(201).json({
        success: true,
        data: {
          demandListing,
        },
      });
    } catch (error: any) {
      console.error('Create demand listing error:', error);

      if (error.message === 'Business not found') {
        return res.status(404).json({
          success: false,
          error: 'Business not found',
        });
      }

      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to create listings for this business',
          },
        });
      }

      if (error.message.includes('required')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while creating the demand listing',
        },
      });
    }
  }
);

/**
 * PUT /api/businesses/:id
 * Update business details
 *
 * Path parameters:
 * - id: Business UUID
 *
 * Request body:
 * {
 *   name?: string,
 *   category?: string,
 *   logo_url?: string | null,
 *   status?: 'active' | 'pending_verification' | 'stealth_mode'
 * }
 *
 * Response (200):
 * {
 *   success: true,
 *   data: {
 *     business: Business
 *   }
 * }
 *
 * Errors:
 * - 401: Unauthorized
 * - 403: Forbidden (user doesn't own the business)
 * - 404: Business not found
 * - 500: Internal server error
 */
router.put(
  '/:id',
  roleGuard.requireTenant(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const businessId = req.params.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      const { name, category, logo_url, status } = req.body;

      // Update business
      const business = await businessController.updateBusiness(businessId, userId, {
        name,
        category,
        logo_url,
        status,
      });

      res.status(200).json({
        success: true,
        data: {
          business,
        },
      });
    } catch (error: any) {
      console.error('Update business error:', error);

      if (error.message === 'Business not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Business not found',
          },
        });
      }

      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to update this business',
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while updating the business',
        },
      });
    }
  }
);

/**
 * DELETE /api/businesses/:id
 * Delete a business and all associated data
 *
 * Path parameters:
 * - id: Business UUID
 *
 * Response (200):
 * {
 *   success: true,
 *   message: 'Business deleted successfully'
 * }
 *
 * Errors:
 * - 401: Unauthorized
 * - 403: Forbidden (user doesn't own the business)
 * - 404: Business not found
 * - 500: Internal server error
 */
router.delete(
  '/:id',
  roleGuard.requireTenant(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const businessId = req.params.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      // Delete business
      await businessController.deleteBusiness(businessId, userId);

      res.status(200).json({
        success: true,
        message: 'Business deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete business error:', error);

      if (error.message === 'Business not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Business not found',
          },
        });
      }

      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete this business',
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while deleting the business',
        },
      });
    }
  }
);

export default router;
