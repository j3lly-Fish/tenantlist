import { Router, Request, Response } from 'express';
import { subscriptionService } from '../services/SubscriptionService';
import { RoleGuardMiddleware } from '../middleware/roleGuardMiddleware';
import Stripe from 'stripe';

const router = Router();
const roleGuard = new RoleGuardMiddleware();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Subscription Routes
 *
 * Handles subscription management with Stripe integration:
 * - GET /plans - List all available subscription plans
 * - GET /current - Get user's current subscription
 * - POST /checkout - Create a Stripe checkout session
 * - POST /portal - Create a Stripe billing portal session
 * - POST /webhook - Handle Stripe webhook events
 * - GET /billing-history - Get user's billing history
 */

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

/**
 * GET /api/subscriptions/plans
 * Get all available subscription plans
 */
router.get('/plans', async (_req: Request, res: Response) => {
  try {
    const plans = await subscriptionService.getPlans();
    res.json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription plans',
    });
  }
});

/**
 * POST /api/subscriptions/webhook
 * Handle Stripe webhook events
 * Note: Must be before authentication middleware and use raw body
 */
router.post(
  '/webhook',
  async (req: Request, res: Response) => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('Stripe webhook secret not configured');
      return res.status(500).json({ error: 'Webhook not configured' });
    }

    const sig = req.headers['stripe-signature'] as string;

    if (!sig) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    let event: Stripe.Event;

    try {
      // Note: req.body must be the raw body for signature verification
      // This requires express.raw() middleware on this specific route
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
        apiVersion: '2025-11-17.clover',
      });
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    try {
      await subscriptionService.handleWebhook(event);
      res.json({ received: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
);

// ============================================================================
// AUTHENTICATED ROUTES
// ============================================================================

/**
 * GET /api/subscriptions/current
 * Get user's current subscription
 */
router.get(
  '/current',
  roleGuard.authenticate(),
  async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    try {
      const subscription = await subscriptionService.getUserSubscription(userId);
      const tier = await subscriptionService.getUserTier(userId);

      res.json({
        success: true,
        data: {
          subscription,
          tier,
          isConfigured: subscriptionService.isConfigured(),
        },
      });
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch subscription',
      });
    }
  }
);

/**
 * POST /api/subscriptions/checkout
 * Create a Stripe checkout session
 */
router.post(
  '/checkout',
  roleGuard.authenticate(),
  async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;
    const userEmail = authReq.user?.email;

    if (!userId || !userEmail) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    if (!subscriptionService.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY.',
      });
    }

    const { planTier, billingInterval = 'monthly' } = req.body;

    if (!planTier) {
      return res.status(400).json({
        success: false,
        error: 'planTier is required',
      });
    }

    if (!['monthly', 'annual'].includes(billingInterval)) {
      return res.status(400).json({
        success: false,
        error: 'billingInterval must be "monthly" or "annual"',
      });
    }

    try {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const successUrl = `${baseUrl}/settings?subscription=success`;
      const cancelUrl = `${baseUrl}/settings?subscription=canceled`;

      const session = await subscriptionService.createCheckoutSession(
        userId,
        userEmail,
        planTier,
        billingInterval,
        successUrl,
        cancelUrl
      );

      res.json({
        success: true,
        data: session,
      });
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create checkout session',
      });
    }
  }
);

/**
 * POST /api/subscriptions/portal
 * Create a Stripe billing portal session
 */
router.post(
  '/portal',
  roleGuard.authenticate(),
  async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    if (!subscriptionService.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Stripe is not configured',
      });
    }

    try {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const returnUrl = `${baseUrl}/settings`;

      const session = await subscriptionService.createBillingPortalSession(
        userId,
        returnUrl
      );

      res.json({
        success: true,
        data: session,
      });
    } catch (error: any) {
      console.error('Error creating billing portal session:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create billing portal session',
      });
    }
  }
);

/**
 * GET /api/subscriptions/billing-history
 * Get user's billing history
 */
router.get(
  '/billing-history',
  roleGuard.authenticate(),
  async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    try {
      const transactions = await subscriptionService.getBillingHistory(userId);

      res.json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      console.error('Error fetching billing history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch billing history',
      });
    }
  }
);

/**
 * GET /api/subscriptions/check-access/:tier
 * Check if user has access to a specific tier
 */
router.get(
  '/check-access/:tier',
  roleGuard.authenticate(),
  async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;
    const { tier } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const validTiers = ['starter', 'pro', 'premium', 'enterprise'];
    if (!validTiers.includes(tier)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tier',
      });
    }

    try {
      const hasAccess = await subscriptionService.hasAccessToTier(userId, tier as any);

      res.json({
        success: true,
        data: { hasAccess, tier },
      });
    } catch (error) {
      console.error('Error checking tier access:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check access',
      });
    }
  }
);

export default router;
