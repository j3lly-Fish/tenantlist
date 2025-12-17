import { Router, Request, Response } from 'express';
import { PropertyListingController } from '../controllers/PropertyListingController';
import { RoleGuardMiddleware } from '../middleware/roleGuardMiddleware';
import { PropertyListingStatus, PropertyType } from '../types';

const router = Router();
const propertyListingController = new PropertyListingController();
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
 * GET /api/property-listings/search
 * Public search for all active property listings (for tenants)
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const {
      city,
      state,
      property_type,
      min_sqft,
      max_sqft,
      min_price,
      max_price,
      amenities,
      search,
      page,
      limit,
    } = req.query;

    const result = await propertyListingController.searchListings({
      city: city as string,
      state: state as string,
      propertyType: property_type as PropertyType,
      minSqft: min_sqft ? parseInt(min_sqft as string, 10) : undefined,
      maxSqft: max_sqft ? parseInt(max_sqft as string, 10) : undefined,
      minPrice: min_price ? parseFloat(min_price as string) : undefined,
      maxPrice: max_price ? parseFloat(max_price as string) : undefined,
      amenities: amenities ? (amenities as string).split(',') : undefined,
      search: search as string,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Search property listings error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while searching property listings',
      },
    });
  }
});

/**
 * GET /api/property-listings/featured
 * Get featured property listings (public)
 */
router.get('/featured', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const listings = await propertyListingController.getFeaturedListings(limit);

    res.json({
      success: true,
      data: { listings },
    });
  } catch (error: any) {
    console.error('Get featured listings error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching featured listings',
      },
    });
  }
});

/**
 * GET /api/property-listings/recent
 * Get recent property listings (public)
 */
router.get('/recent', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const listings = await propertyListingController.getRecentListings(limit);

    res.json({
      success: true,
      data: { listings },
    });
  } catch (error: any) {
    console.error('Get recent listings error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching recent listings',
      },
    });
  }
});

/**
 * GET /api/property-listings/my
 * List property listings for authenticated landlord/broker
 */
router.get(
  '/my',
  roleGuard.requireLandlordOrBroker(),
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

      const { status, property_type, search, page, limit } = req.query;

      const result = await propertyListingController.listMyListings(userId, {
        status: status as PropertyListingStatus,
        propertyType: property_type as PropertyType,
        search: search as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('List my listings error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching your listings',
        },
      });
    }
  }
);

/**
 * GET /api/property-listings/dashboard
 * Get dashboard stats for landlord/broker
 */
router.get(
  '/dashboard',
  roleGuard.requireLandlordOrBroker(),
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

      const stats = await propertyListingController.getDashboardStats(userId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching dashboard stats',
        },
      });
    }
  }
);

/**
 * GET /api/property-listings/:id
 * Get single property listing by ID
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const listingId = req.params.id;
    const userId = req.user?.userId;

    const result = await propertyListingController.getListingById(listingId, userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Get property listing error:', error);

    if (error.message === 'Property listing not found') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Property listing not found',
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching the property listing',
      },
    });
  }
});

/**
 * POST /api/property-listings
 * Create a new property listing
 */
router.post(
  '/',
  roleGuard.requireLandlordOrBroker(),
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
        title,
        description,
        property_type,
        address,
        city,
        state,
        zip_code,
        latitude,
        longitude,
        sqft,
        lot_size,
        year_built,
        floors,
        asking_price,
        price_per_sqft,
        lease_type,
        cam_charges,
        available_date,
        min_lease_term,
        max_lease_term,
        amenities,
        highlights,
        photos,
        virtual_tour_url,
        documents,
        contact_name,
        contact_email,
        contact_phone,
      } = req.body;

      const listing = await propertyListingController.createListing(userId, {
        title,
        description,
        property_type,
        address,
        city,
        state,
        zip_code,
        latitude,
        longitude,
        sqft,
        lot_size,
        year_built,
        floors,
        asking_price,
        price_per_sqft,
        lease_type,
        cam_charges,
        available_date,
        min_lease_term,
        max_lease_term,
        amenities,
        highlights,
        photos,
        virtual_tour_url,
        documents,
        contact_name,
        contact_email,
        contact_phone,
      });

      res.status(201).json({
        success: true,
        data: { listing },
      });
    } catch (error: any) {
      console.error('Create property listing error:', error);

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
          message: 'An error occurred while creating the property listing',
        },
      });
    }
  }
);

/**
 * PUT /api/property-listings/:id
 * Update a property listing
 */
router.put(
  '/:id',
  roleGuard.requireLandlordOrBroker(),
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

      const listing = await propertyListingController.updateListing(listingId, userId, req.body);

      res.json({
        success: true,
        data: { listing },
      });
    } catch (error: any) {
      console.error('Update property listing error:', error);

      if (error.message === 'Property listing not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Property listing not found',
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
          message: 'An error occurred while updating the property listing',
        },
      });
    }
  }
);

/**
 * PATCH /api/property-listings/:id/status
 * Update property listing status
 */
router.patch(
  '/:id/status',
  roleGuard.requireLandlordOrBroker(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const listingId = req.params.id;
      const { status } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      if (!status || !['active', 'pending', 'leased', 'off_market'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid status. Must be one of: active, pending, leased, off_market',
          },
        });
      }

      const listing = await propertyListingController.updateListingStatus(
        listingId,
        userId,
        status as PropertyListingStatus
      );

      res.json({
        success: true,
        data: { listing },
      });
    } catch (error: any) {
      console.error('Update listing status error:', error);

      if (error.message === 'Property listing not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Property listing not found',
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
          message: 'An error occurred while updating the listing status',
        },
      });
    }
  }
);

/**
 * DELETE /api/property-listings/:id
 * Delete a property listing
 */
router.delete(
  '/:id',
  roleGuard.requireLandlordOrBroker(),
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

      await propertyListingController.deleteListing(listingId, userId);

      res.json({
        success: true,
        message: 'Property listing deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete property listing error:', error);

      if (error.message === 'Property listing not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Property listing not found',
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
          message: 'An error occurred while deleting the property listing',
        },
      });
    }
  }
);

/**
 * POST /api/property-listings/:id/inquiry
 * Record an inquiry for a property listing
 */
router.post('/:id/inquiry', async (req: Request, res: Response) => {
  try {
    const listingId = req.params.id;

    await propertyListingController.recordInquiry(listingId);

    res.json({
      success: true,
      message: 'Inquiry recorded',
    });
  } catch (error: any) {
    console.error('Record inquiry error:', error);

    if (error.message === 'Property listing not found') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Property listing not found',
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while recording the inquiry',
      },
    });
  }
});

/**
 * POST /api/property-listings/:id/favorite
 * Record a favorite for a property listing
 */
router.post('/:id/favorite', async (req: Request, res: Response) => {
  try {
    const listingId = req.params.id;

    await propertyListingController.recordFavorite(listingId);

    res.json({
      success: true,
      message: 'Favorite recorded',
    });
  } catch (error: any) {
    console.error('Record favorite error:', error);

    if (error.message === 'Property listing not found') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Property listing not found',
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while recording the favorite',
      },
    });
  }
});

export default router;
