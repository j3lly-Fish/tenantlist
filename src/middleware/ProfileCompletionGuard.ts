import { Request, Response, NextFunction } from 'express';
import { UserProfileModel } from '../database/models/UserProfile';

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
 * ProfileCompletionGuard middleware
 * Ensures user has completed their business profile before accessing dashboard
 *
 * Checks user_profiles.profile_completed === true
 * Returns 403 if profile is incomplete with redirect URL
 */
export class ProfileCompletionGuard {
  private userProfileModel: UserProfileModel;

  constructor(userProfileModel?: UserProfileModel) {
    this.userProfileModel = userProfileModel || new UserProfileModel();
  }

  /**
   * Middleware function to check if user has completed their profile
   *
   * @returns Express middleware function
   */
  check() {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

        // Get user profile
        const profile = await this.userProfileModel.findByUserId(userId);

        if (!profile) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'PROFILE_NOT_FOUND',
              message: 'User profile not found',
            },
            redirectTo: '/profile/create',
          });
        }

        // Check if profile is completed
        if (!profile.profile_completed) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'PROFILE_INCOMPLETE',
              message: 'Please complete your business profile to access the dashboard',
            },
            redirectTo: '/profile/complete',
          });
        }

        // Profile is complete, continue to next middleware/route handler
        next();
      } catch (error) {
        console.error('ProfileCompletionGuard error:', error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An error occurred while checking profile completion',
          },
        });
      }
    };
  }
}

/**
 * Default export: singleton instance
 */
export default new ProfileCompletionGuard();
