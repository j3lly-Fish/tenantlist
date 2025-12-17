import { Request, Response, NextFunction } from 'express';
import { subscriptionService } from '../services/SubscriptionService';
import { SubscriptionTier } from '../types';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  subscriptionTier?: SubscriptionTier;
}

/**
 * SubscriptionGuardMiddleware
 *
 * Middleware to enforce subscription tier requirements for routes.
 * Features:
 * - Tier-based access control
 * - Feature limit checking
 * - Graceful handling when Stripe is not configured
 */
export class SubscriptionGuardMiddleware {
  /**
   * Require a minimum subscription tier
   * @param requiredTier - Minimum tier required to access the route
   */
  requireTier(requiredTier: SubscriptionTier) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      try {
        const hasAccess = await subscriptionService.hasAccessToTier(userId, requiredTier);

        if (!hasAccess) {
          const userTier = await subscriptionService.getUserTier(userId);
          return res.status(403).json({
            success: false,
            error: 'Subscription upgrade required',
            details: {
              currentTier: userTier,
              requiredTier,
              upgradeUrl: '/settings?tab=subscription',
            },
          });
        }

        // Attach tier to request for downstream use
        authReq.subscriptionTier = await subscriptionService.getUserTier(userId);
        next();
      } catch (error) {
        console.error('Error checking subscription tier:', error);
        // Fail open - allow access if there's an error (better UX)
        next();
      }
    };
  }

  /**
   * Attach subscription tier to request (non-blocking)
   * Use this for routes that need tier info but don't require a specific tier
   */
  attachTier() {
    return async (req: Request, _res: Response, next: NextFunction) => {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;

      if (userId) {
        try {
          authReq.subscriptionTier = await subscriptionService.getUserTier(userId);
        } catch (error) {
          console.error('Error attaching subscription tier:', error);
          authReq.subscriptionTier = 'starter' as SubscriptionTier;
        }
      }

      next();
    };
  }

  /**
   * Check if user has reached a specific limit
   * @param limitType - The type of limit to check (locations, qfps, team_members)
   * @param getCurrentCount - Function to get current usage count
   */
  checkLimit(
    limitType: 'locations' | 'qfps' | 'team_members',
    getCurrentCount: (userId: string) => Promise<number>
  ) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      try {
        const subscription = await subscriptionService.getUserSubscription(userId);
        const limits = subscription?.plan?.limits || { locations: 2, qfps: 3, team_members: 1 };
        const limit = limits[limitType];

        // -1 means unlimited
        if (limit === -1) {
          return next();
        }

        const currentCount = await getCurrentCount(userId);

        if (currentCount >= limit) {
          const userTier = await subscriptionService.getUserTier(userId);
          return res.status(403).json({
            success: false,
            error: `You have reached your ${limitType.replace('_', ' ')} limit`,
            details: {
              currentTier: userTier,
              limit,
              currentCount,
              upgradeUrl: '/settings?tab=subscription',
            },
          });
        }

        next();
      } catch (error) {
        console.error('Error checking limit:', error);
        // Fail open
        next();
      }
    };
  }
}

// Tier constants for easy reference
export const TIERS = {
  STARTER: 'starter' as SubscriptionTier,
  PRO: 'pro' as SubscriptionTier,
  PREMIUM: 'premium' as SubscriptionTier,
  ENTERPRISE: 'enterprise' as SubscriptionTier,
};

// Feature tier requirements
export const FEATURE_TIERS = {
  // Starter features (free)
  SMART_MATCHING: TIERS.STARTER,
  BASIC_DASHBOARD: TIERS.STARTER,
  DIRECT_MESSAGING: TIERS.STARTER,
  DOCUMENT_RECEIVE: TIERS.STARTER,
  BASIC_MARKET_INSIGHTS: TIERS.STARTER,

  // Pro features
  TEAM_HIERARCHY: TIERS.PRO,
  KANBAN_PIPELINE: TIERS.PRO,
  BROKER_COLLABORATION: TIERS.PRO,
  CALENDAR_INTEGRATION: TIERS.PRO,
  SAVED_SEARCHES: TIERS.PRO,
  DOCUMENT_COLLABORATE: TIERS.PRO,

  // Premium features
  AI_SCORING: TIERS.PREMIUM,
  DRIVE_TIME_ANALYSIS: TIERS.PREMIUM,
  HEATMAPS: TIERS.PREMIUM,
  COMPETITIVE_INTEL: TIERS.PREMIUM,
  STEALTH_MODE: TIERS.PREMIUM,
  CONTACT_UNLOCKING: TIERS.PREMIUM,
  VIDEO_PROFILES: TIERS.PREMIUM,
  LEASE_EXPIRY_ALERTS: TIERS.PREMIUM,

  // Enterprise features
  UNLIMITED_LOCATIONS: TIERS.ENTERPRISE,
  THREE_LAYER_HIERARCHY: TIERS.ENTERPRISE,
  COMPETITOR_METRICS: TIERS.ENTERPRISE,
  PAGE_VIEW_TRACKING: TIERS.ENTERPRISE,
  MULTI_LISTING_COMPARISON: TIERS.ENTERPRISE,
  DEDICATED_SUPPORT: TIERS.ENTERPRISE,
  CUSTOM_INTEGRATIONS: TIERS.ENTERPRISE,
};

// Export singleton instance
export const subscriptionGuard = new SubscriptionGuardMiddleware();
