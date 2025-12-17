import { Router, Request, Response } from 'express';
import { NotificationPreferencesModel, NotificationPreferences } from '../database/models/NotificationPreferences';
import { RoleGuardMiddleware } from '../middleware/roleGuardMiddleware';

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

const router = Router();

/**
 * GET /api/notifications/preferences
 * Get current user's notification preferences
 */
router.get(
  '/preferences',
  roleGuard.authenticate(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const preferences = await NotificationPreferencesModel.getByUserId(userId);

      res.json({
        success: true,
        data: {
          preferences: {
            email: {
              new_matches: preferences.email_new_matches,
              new_messages: preferences.email_new_messages,
              business_invites: preferences.email_business_invites,
              tour_reminders: preferences.email_tour_reminders,
              account_updates: preferences.email_account_updates,
              weekly_digest: preferences.email_weekly_digest,
            },
            inApp: {
              new_matches: preferences.inapp_new_matches,
              new_messages: preferences.inapp_new_messages,
              business_invites: preferences.inapp_business_invites,
              tour_reminders: preferences.inapp_tour_reminders,
              account_updates: preferences.inapp_account_updates,
            },
            settings: {
              email_frequency: preferences.email_frequency,
              quiet_hours_start: preferences.quiet_hours_start,
              quiet_hours_end: preferences.quiet_hours_end,
              timezone: preferences.timezone,
            },
            unsubscribed_all: preferences.unsubscribed_all,
          },
        },
      });
    } catch (error: any) {
      console.error('Error fetching notification preferences:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch notification preferences',
      });
    }
  }
);

/**
 * PUT /api/notifications/preferences
 * Update notification preferences
 */
router.put(
  '/preferences',
  roleGuard.authenticate(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { email, inApp, settings, unsubscribed_all } = req.body;

      // Build update object
      const updates: Partial<NotificationPreferences> = {};

      if (email !== undefined) {
        if (email.new_matches !== undefined) updates.email_new_matches = email.new_matches;
        if (email.new_messages !== undefined) updates.email_new_messages = email.new_messages;
        if (email.business_invites !== undefined) updates.email_business_invites = email.business_invites;
        if (email.tour_reminders !== undefined) updates.email_tour_reminders = email.tour_reminders;
        if (email.account_updates !== undefined) updates.email_account_updates = email.account_updates;
        if (email.weekly_digest !== undefined) updates.email_weekly_digest = email.weekly_digest;
      }

      if (inApp !== undefined) {
        if (inApp.new_matches !== undefined) updates.inapp_new_matches = inApp.new_matches;
        if (inApp.new_messages !== undefined) updates.inapp_new_messages = inApp.new_messages;
        if (inApp.business_invites !== undefined) updates.inapp_business_invites = inApp.business_invites;
        if (inApp.tour_reminders !== undefined) updates.inapp_tour_reminders = inApp.tour_reminders;
        if (inApp.account_updates !== undefined) updates.inapp_account_updates = inApp.account_updates;
      }

      if (settings !== undefined) {
        if (settings.email_frequency !== undefined) updates.email_frequency = settings.email_frequency;
        if (settings.quiet_hours_start !== undefined) updates.quiet_hours_start = settings.quiet_hours_start;
        if (settings.quiet_hours_end !== undefined) updates.quiet_hours_end = settings.quiet_hours_end;
        if (settings.timezone !== undefined) updates.timezone = settings.timezone;
      }

      if (unsubscribed_all !== undefined) {
        updates.unsubscribed_all = unsubscribed_all;
      }

      const preferences = await NotificationPreferencesModel.update(userId, updates);

      res.json({
        success: true,
        data: {
          preferences: {
            email: {
              new_matches: preferences.email_new_matches,
              new_messages: preferences.email_new_messages,
              business_invites: preferences.email_business_invites,
              tour_reminders: preferences.email_tour_reminders,
              account_updates: preferences.email_account_updates,
              weekly_digest: preferences.email_weekly_digest,
            },
            inApp: {
              new_matches: preferences.inapp_new_matches,
              new_messages: preferences.inapp_new_messages,
              business_invites: preferences.inapp_business_invites,
              tour_reminders: preferences.inapp_tour_reminders,
              account_updates: preferences.inapp_account_updates,
            },
            settings: {
              email_frequency: preferences.email_frequency,
              quiet_hours_start: preferences.quiet_hours_start,
              quiet_hours_end: preferences.quiet_hours_end,
              timezone: preferences.timezone,
            },
            unsubscribed_all: preferences.unsubscribed_all,
          },
        },
        message: 'Notification preferences updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating notification preferences:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update notification preferences',
      });
    }
  }
);

/**
 * POST /api/notifications/unsubscribe-all
 * Unsubscribe from all marketing emails
 */
router.post(
  '/unsubscribe-all',
  roleGuard.authenticate(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      await NotificationPreferencesModel.unsubscribeAll(userId);

      res.json({
        success: true,
        message: 'Successfully unsubscribed from all marketing emails',
      });
    } catch (error: any) {
      console.error('Error unsubscribing:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to unsubscribe',
      });
    }
  }
);

/**
 * POST /api/notifications/resubscribe
 * Resubscribe to emails
 */
router.post(
  '/resubscribe',
  roleGuard.authenticate(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      await NotificationPreferencesModel.resubscribe(userId);

      res.json({
        success: true,
        message: 'Successfully resubscribed to emails',
      });
    } catch (error: any) {
      console.error('Error resubscribing:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to resubscribe',
      });
    }
  }
);

/**
 * GET /api/notifications/unsubscribe
 * Public endpoint for email unsubscribe links (one-click unsubscribe)
 * Uses token-based auth for security
 */
router.get('/unsubscribe', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, email } = req.query;

    if (!token || !email) {
      res.status(400).json({
        success: false,
        error: 'Missing required parameters',
      });
      return;
    }

    // TODO: Implement token verification for one-click unsubscribe
    // For now, redirect to login page with unsubscribe action
    res.redirect(`${process.env.FRONTEND_URL}/settings/notifications?unsubscribe=true`);
  } catch (error: any) {
    console.error('Error processing unsubscribe:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process unsubscribe',
    });
  }
});

export default router;
