import { Router, Request, Response } from 'express';
import { BusinessController } from '../controllers/BusinessController';
import { RoleGuardMiddleware } from '../middleware/roleGuardMiddleware';

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

      const {
        business_id,
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
        business_id,
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
 * PUT /api/demand-listings/:id
 * Update a demand listing
 */
router.put(
  '/:id',
  roleGuard.requireTenant(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const listingId = req.params.id;

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

      const demandListing = await businessController.updateDemandListing(listingId, userId, {
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

      res.json({
        success: true,
        data: {
          demandListing,
        },
      });
    } catch (error: any) {
      console.error('Update demand listing error:', error);

      if (error.message === 'Demand listing not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Demand listing not found',
          },
        });
      }

      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to update this listing',
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while updating the demand listing',
        },
      });
    }
  }
);

/**
 * DELETE /api/demand-listings/:id
 * Delete a demand listing
 */
router.delete(
  '/:id',
  roleGuard.requireTenant(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const listingId = req.params.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      await businessController.deleteDemandListing(listingId, userId);

      res.json({
        success: true,
        message: 'Demand listing deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete demand listing error:', error);

      if (error.message === 'Demand listing not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Demand listing not found',
          },
        });
      }

      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete this listing',
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while deleting the demand listing',
        },
      });
    }
  }
);

/**
 * PATCH /api/demand-listings/:id/stealth
 * Toggle stealth mode for a demand listing
 */
router.patch(
  '/:id/stealth',
  roleGuard.requireTenant(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const listingId = req.params.id;
      const { enabled } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      if (typeof enabled !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'enabled field must be a boolean',
          },
        });
      }

      const demandListing = await businessController.toggleStealthMode(listingId, userId, enabled);

      res.json({
        success: true,
        data: {
          demandListing,
          stealthMode: enabled,
        },
      });
    } catch (error: any) {
      console.error('Toggle stealth mode error:', error);

      if (error.message === 'Demand listing not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Demand listing not found',
          },
        });
      }

      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to update this listing',
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while toggling stealth mode',
        },
      });
    }
  }
);

export default router;
