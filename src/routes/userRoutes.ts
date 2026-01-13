import { Router, Response } from 'express';
import multer from 'multer';
import { UserManagementController } from '../controllers/UserManagementController';
import { BusinessController } from '../controllers/BusinessController';
import { AuthMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';
import { RoleGuardMiddleware } from '../middleware/roleGuardMiddleware';
import pool from '../config/database';

const router = Router();
const userManagementController = new UserManagementController();
const businessController = new BusinessController();
const authMiddleware = new AuthMiddleware();
const roleGuard = new RoleGuardMiddleware();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File must be JPG, PNG, or GIF'));
    }
  },
});

/**
 * PATCH /api/users/profile
 * Update user profile information
 *
 * Request headers:
 * - Authorization: Bearer <accessToken>
 *
 * Request body (multipart/form-data or JSON):
 * {
 *   firstName?: string,
 *   lastName?: string,
 *   bio?: string,
 *   phone?: string,
 *   photo?: file (for multipart) or base64 string (for JSON)
 * }
 *
 * Response (200):
 * {
 *   profile: {
 *     first_name: string,
 *     last_name: string,
 *     bio: string | null,
 *     phone: string,
 *     photo_url: string | null
 *   }
 * }
 *
 * Errors:
 * - 400: Validation error
 * - 401: Unauthorized
 */
router.patch(
  '/profile',
  authMiddleware.getMiddleware(),
  upload.single('photo'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // User is already authenticated, get access token from header
      const authHeader = req.headers.authorization;
      const accessToken = authHeader?.replace('Bearer ', '') || '';

      // Build profile update data
      const updateData: any = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        bio: req.body.bio,
        phone: req.body.phone,
      };

      // Handle file upload
      if (req.file) {
        updateData.photo = {
          buffer: req.file.buffer,
          mimeType: req.file.mimetype,
          size: req.file.size,
          originalName: req.file.originalname,
        };
      }

      // Update profile
      const result = await userManagementController.updateProfile(accessToken, updateData);

      res.status(200).json(result);
    } catch (error: any) {
      if (
        error.message.includes('cannot be empty') ||
        error.message.includes('must not exceed') ||
        error.message.includes('E.164 format') ||
        error.message.includes('File must be')
      ) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
          },
        });
      } else {
        console.error('Update profile error:', error);
        res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An error occurred updating profile',
          },
        });
      }
    }
  }
);

/**
 * PATCH /api/users/role
 * Change user role
 *
 * Request headers:
 * - Authorization: Bearer <accessToken>
 *
 * Request body:
 * {
 *   role: 'tenant' | 'landlord' | 'broker'
 * }
 *
 * Response (200):
 * {
 *   user: {
 *     id: string,
 *     email: string,
 *     role: string
 *   }
 * }
 *
 * Errors:
 * - 400: Invalid role
 * - 401: Unauthorized
 */
router.patch('/role', authMiddleware.getMiddleware(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    // User is already authenticated, get access token from header
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.replace('Bearer ', '') || '';

    // Validate request body
    if (!req.body.role) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Role is required',
        },
      });
    }

    // Update role
    const result = await userManagementController.updateRole(accessToken, {
      role: req.body.role,
    });

    res.status(200).json(result);
  } catch (error: any) {
    if (error.message.includes('must be one of')) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ROLE',
          message: error.message,
        },
      });
    } else {
      console.error('Update role error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred updating role',
        },
      });
    }
  }
});

/**
 * Task Group 3.4: POST /api/user/businesses
 * Add an existing business to user's portfolio
 * Requires authentication (tenant role)
 *
 * Request body:
 * {
 *   businessId: string (required)
 * }
 *
 * Response (201):
 * {
 *   success: true,
 *   data: {
 *     businessId: string,
 *     message: string
 *   }
 * }
 *
 * Errors:
 * - 400: Validation error (missing businessId)
 * - 401: Unauthorized
 * - 404: Business not found
 * - 500: Internal server error
 */
router.post(
  '/businesses',
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

      const { businessId } = req.body;

      if (!businessId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Business ID is required',
          },
        });
      }

      const result = await businessController.addBusinessToUser(userId, businessId);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Add business to user error:', error);

      if (error.message === 'Business not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Business not found',
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
          message: 'An error occurred while adding business to portfolio',
        },
      });
    }
  }
);

/**
 * Task Group 3.5: GET /api/user/businesses
 * Get all businesses associated with authenticated user
 * Requires authentication (tenant role)
 *
 * Response (200):
 * {
 *   success: true,
 *   data: {
 *     businesses: Business[],
 *     count: number
 *   }
 * }
 *
 * Errors:
 * - 401: Unauthorized
 * - 500: Internal server error
 */
router.get(
  '/businesses',
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

      const result = await businessController.getUserBusinesses(userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Get user businesses error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching user businesses',
        },
      });
    }
  }
);

/**
 * GET /api/users/search/brokers
 * Search for brokers by name or email (for tenant invitations)
 *
 * Request headers:
 * - Authorization: Bearer <accessToken>
 *
 * Query parameters:
 * - q: search query (name or email)
 * - limit?: number (default: 10, max: 50)
 *
 * Response (200):
 * {
 *   success: true,
 *   data: {
 *     brokers: Array<{
 *       id: string,
 *       name: string,
 *       email: string,
 *       company_name?: string,
 *       photo_url?: string
 *     }>
 *   }
 * }
 */
router.get(
  '/search/brokers',
  authMiddleware.getMiddleware(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const searchQuery = req.query.q as string;
      const limit = Math.min(50, parseInt(req.query.limit as string) || 10);

      if (!searchQuery || searchQuery.trim().length === 0) {
        return res.status(200).json({
          success: true,
          data: { brokers: [] },
        });
      }

      // Search for brokers by name or email
      const query = `
        SELECT
          u.id,
          up.first_name || ' ' || up.last_name as name,
          u.email,
          up.photo_url,
          bp.company_name
        FROM users u
        LEFT JOIN user_profiles up ON up.user_id = u.id
        LEFT JOIN broker_profiles bp ON bp.user_id = u.id
        WHERE u.role = 'broker'
          AND u.is_active = true
          AND (
            u.email ILIKE $1
            OR up.first_name ILIKE $1
            OR up.last_name ILIKE $1
            OR (up.first_name || ' ' || up.last_name) ILIKE $1
            OR bp.company_name ILIKE $1
          )
        ORDER BY
          CASE
            WHEN u.email ILIKE $1 THEN 1
            WHEN (up.first_name || ' ' || up.last_name) ILIKE $2 THEN 2
            ELSE 3
          END,
          up.first_name, up.last_name
        LIMIT $3
      `;

      const result = await pool.query(query, [
        `%${searchQuery}%`,
        `${searchQuery}%`,
        limit,
      ]);

      res.status(200).json({
        success: true,
        data: {
          brokers: result.rows,
        },
      });
    } catch (error: any) {
      console.error('Search brokers error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while searching for brokers',
        },
      });
    }
  }
);

export default router;
