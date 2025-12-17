import { Router, Response } from 'express';
import multer from 'multer';
import { UserManagementController } from '../controllers/UserManagementController';
import { AuthMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();
const userManagementController = new UserManagementController();
const authMiddleware = new AuthMiddleware();

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

export default router;
