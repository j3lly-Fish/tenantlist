import { Router, Request, Response } from 'express';
import { ProfileController } from '../controllers/ProfileController';
import { JwtService } from '../services/auth/JwtService';

const router = Router();
const profileController = new ProfileController();
const jwtService = new JwtService();

/**
 * Extract and verify access token from request
 */
async function getUserIdFromToken(req: Request): Promise<string> {
  // Extract access token from cookie first, fall back to Authorization header
  let accessToken = req.cookies?.accessToken;

  if (!accessToken) {
    const authHeader = req.headers.authorization;
    accessToken = jwtService.extractTokenFromHeader(authHeader);
  }

  if (!accessToken) {
    throw new Error('Access token is required');
  }

  // Verify token
  const payload = jwtService.verifyAccessToken(accessToken);
  if (!payload) {
    throw new Error('Invalid or expired access token');
  }

  return payload.userId;
}

/**
 * POST /api/profile/complete
 * Complete user profile after signup
 *
 * Request body:
 * {
 *   first_name: string,
 *   last_name: string,
 *   phone: string,
 *   bio?: string,
 *   photo_url?: string
 * }
 *
 * Response (200):
 * {
 *   success: true,
 *   data: {
 *     profile: { ... }
 *   }
 * }
 *
 * Errors:
 * - 400: Validation error
 * - 401: Unauthorized
 * - 404: User not found
 */
router.post('/complete', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req);
    const result = await profileController.completeProfile(userId, req.body);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error.message.includes('Access token') || error.message.includes('Invalid') || error.message.includes('expired')) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired access token',
        },
      });
    }

    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: error.message,
        },
      });
    }

    if (error.message.includes('required') || error.message.includes('must be')) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
        },
      });
    }

    console.error('Profile completion error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred completing profile',
      },
    });
  }
});

/**
 * GET /api/profile
 * Get user profile
 *
 * Response (200):
 * {
 *   success: true,
 *   data: {
 *     profile: { ... }
 *   }
 * }
 *
 * Errors:
 * - 401: Unauthorized
 * - 404: Profile not found
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req);
    const result = await profileController.getProfile(userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error.message.includes('Access token') || error.message.includes('Invalid') || error.message.includes('expired')) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired access token',
        },
      });
    }

    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: error.message,
        },
      });
    }

    console.error('Get profile error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred fetching profile',
      },
    });
  }
});

/**
 * PUT /api/profile
 * Update user profile
 *
 * Request body:
 * {
 *   first_name?: string,
 *   last_name?: string,
 *   phone?: string,
 *   bio?: string,
 *   photo_url?: string
 * }
 *
 * Response (200):
 * {
 *   success: true,
 *   data: {
 *     profile: { ... }
 *   }
 * }
 *
 * Errors:
 * - 400: Validation error
 * - 401: Unauthorized
 * - 404: Profile not found
 */
router.put('/', async (req: Request, res: Response) => {
  try {
    const userId = await getUserIdFromToken(req);
    const result = await profileController.updateProfile(userId, req.body);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error.message.includes('Access token') || error.message.includes('Invalid') || error.message.includes('expired')) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired access token',
        },
      });
    }

    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: error.message,
        },
      });
    }

    if (error.message.includes('required') || error.message.includes('must be')) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
        },
      });
    }

    console.error('Update profile error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred updating profile',
      },
    });
  }
});

export default router;
