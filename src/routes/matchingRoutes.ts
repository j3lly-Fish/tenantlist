import { Router, Request, Response } from 'express';
import { MatchingService } from '../services/MatchingService';
import { RoleGuardMiddleware } from '../middleware/roleGuardMiddleware';

const router = Router();
const matchingService = new MatchingService();
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
 * GET /api/matches
 * Get top matches for the authenticated user across all their demand listings
 */
router.get(
  '/',
  roleGuard.authenticate(),
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

      const { limit } = req.query;
      const matchLimit = limit ? parseInt(limit as string, 10) : 10;

      const matches = await matchingService.getMatchesForUser(userId, matchLimit);

      res.json({
        success: true,
        data: {
          matches,
          total: matches.length,
        },
      });
    } catch (error: any) {
      console.error('Get matches error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching matches',
        },
      });
    }
  }
);

/**
 * GET /api/matches/saved
 * Get saved matches for the authenticated user
 */
router.get(
  '/saved',
  roleGuard.authenticate(),
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

      const matches = await matchingService.getSavedMatches(userId);

      res.json({
        success: true,
        data: {
          matches,
          total: matches.length,
        },
      });
    } catch (error: any) {
      console.error('Get saved matches error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching saved matches',
        },
      });
    }
  }
);

/**
 * GET /api/matches/demand-listing/:id
 * Get matches for a specific demand listing
 */
router.get(
  '/demand-listing/:id',
  roleGuard.authenticate(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const demandListingId = req.params.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      const { limit, include_dismissed } = req.query;

      const matches = await matchingService.getMatchesForDemandListing(demandListingId, {
        limit: limit ? parseInt(limit as string, 10) : 10,
        includeDismissed: include_dismissed === 'true',
      });

      res.json({
        success: true,
        data: {
          matches,
          total: matches.length,
        },
      });
    } catch (error: any) {
      console.error('Get demand listing matches error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching matches',
        },
      });
    }
  }
);

/**
 * POST /api/matches/demand-listing/:id/refresh
 * Refresh matches for a specific demand listing
 */
router.post(
  '/demand-listing/:id/refresh',
  roleGuard.authenticate(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const demandListingId = req.params.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      // Get notify preference from query/body
      const { notify } = req.query;
      const sendNotification = notify === 'true';

      const matches = await matchingService.findMatchesForDemandListing(
        demandListingId,
        10,
        sendNotification
      );

      res.json({
        success: true,
        data: {
          matches,
          total: matches.length,
        },
        message: `Found ${matches.length} matching properties`,
      });
    } catch (error: any) {
      console.error('Refresh matches error:', error);

      if (error.message === 'Demand listing not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Demand listing not found',
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while refreshing matches',
        },
      });
    }
  }
);

/**
 * POST /api/matches/:id/view
 * Mark a match as viewed
 */
router.post(
  '/:id/view',
  roleGuard.authenticate(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const matchId = req.params.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      await matchingService.markAsViewed(matchId);

      res.json({
        success: true,
        message: 'Match marked as viewed',
      });
    } catch (error: any) {
      console.error('Mark as viewed error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while marking match as viewed',
        },
      });
    }
  }
);

/**
 * POST /api/matches/:id/save
 * Toggle save status for a match
 */
router.post(
  '/:id/save',
  roleGuard.authenticate(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const matchId = req.params.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      const isSaved = await matchingService.toggleSaved(matchId);

      res.json({
        success: true,
        data: { isSaved },
        message: isSaved ? 'Match saved' : 'Match unsaved',
      });
    } catch (error: any) {
      console.error('Toggle save error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while saving match',
        },
      });
    }
  }
);

/**
 * POST /api/matches/:id/dismiss
 * Dismiss a match
 */
router.post(
  '/:id/dismiss',
  roleGuard.authenticate(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const matchId = req.params.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      await matchingService.dismissMatch(matchId);

      res.json({
        success: true,
        message: 'Match dismissed',
      });
    } catch (error: any) {
      console.error('Dismiss match error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while dismissing match',
        },
      });
    }
  }
);

/**
 * POST /api/matches/refresh-all
 * Refresh matches for all active demand listings (admin/cron endpoint)
 */
router.post(
  '/refresh-all',
  roleGuard.authenticate(),
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

      const totalMatches = await matchingService.refreshAllMatches();

      res.json({
        success: true,
        data: { totalMatches },
        message: `Refreshed ${totalMatches} total matches`,
      });
    } catch (error: any) {
      console.error('Refresh all matches error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while refreshing all matches',
        },
      });
    }
  }
);

export default router;
