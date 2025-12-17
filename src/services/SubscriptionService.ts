import Stripe from 'stripe';
import pool from '../config/database';
import {
  SubscriptionPlan,
  SubscriptionWithPlan,
  BillingTransaction,
  SubscriptionTier,
  SubscriptionStatus,
} from '../types';

/**
 * SubscriptionService
 *
 * Handles subscription management with Stripe integration:
 * - Creating checkout sessions
 * - Managing subscriptions
 * - Processing webhooks
 * - Billing portal access
 */
export class SubscriptionService {
  private stripe: Stripe | null = null;

  constructor() {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (stripeKey && stripeKey !== 'your-stripe-secret-key') {
      this.stripe = new Stripe(stripeKey, {
        apiVersion: '2025-11-17.clover',
      });
    }
  }

  /**
   * Check if Stripe is configured
   */
  isConfigured(): boolean {
    return this.stripe !== null;
  }

  // ============================================================================
  // SUBSCRIPTION PLANS
  // ============================================================================

  /**
   * Get all active subscription plans
   */
  async getPlans(): Promise<SubscriptionPlan[]> {
    const result = await pool.query<SubscriptionPlan>(
      `SELECT * FROM subscription_plans WHERE is_active = true ORDER BY display_order`
    );
    return result.rows.map(this.transformPlan);
  }

  /**
   * Get a specific plan by tier
   */
  async getPlanByTier(tier: SubscriptionTier): Promise<SubscriptionPlan | null> {
    const result = await pool.query<SubscriptionPlan>(
      `SELECT * FROM subscription_plans WHERE tier = $1`,
      [tier]
    );
    return result.rows[0] ? this.transformPlan(result.rows[0]) : null;
  }

  /**
   * Get a specific plan by ID
   */
  async getPlanById(planId: string): Promise<SubscriptionPlan | null> {
    const result = await pool.query<SubscriptionPlan>(
      `SELECT * FROM subscription_plans WHERE id = $1`,
      [planId]
    );
    return result.rows[0] ? this.transformPlan(result.rows[0]) : null;
  }

  // ============================================================================
  // USER SUBSCRIPTIONS
  // ============================================================================

  /**
   * Get user's current subscription
   */
  async getUserSubscription(userId: string): Promise<SubscriptionWithPlan | null> {
    const result = await pool.query(
      `SELECT s.*, row_to_json(sp.*) as plan
       FROM subscriptions s
       JOIN subscription_plans sp ON s.plan_id = sp.id
       WHERE s.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      ...row,
      plan: this.transformPlan(row.plan),
    };
  }

  /**
   * Get user's current tier (returns 'starter' if no subscription)
   */
  async getUserTier(userId: string): Promise<SubscriptionTier> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription || subscription.status !== 'active') {
      return SubscriptionTier.STARTER;
    }
    return subscription.plan.tier;
  }

  /**
   * Check if user has access to a specific tier or higher
   */
  async hasAccessToTier(userId: string, requiredTier: SubscriptionTier): Promise<boolean> {
    const userTier = await this.getUserTier(userId);
    const tierOrder: SubscriptionTier[] = [
      SubscriptionTier.STARTER,
      SubscriptionTier.PRO,
      SubscriptionTier.PREMIUM,
      SubscriptionTier.ENTERPRISE,
    ];
    const userTierIndex = tierOrder.indexOf(userTier);
    const requiredTierIndex = tierOrder.indexOf(requiredTier);
    return userTierIndex >= requiredTierIndex;
  }

  // ============================================================================
  // STRIPE CHECKOUT
  // ============================================================================

  /**
   * Create a Stripe checkout session for subscription
   */
  async createCheckoutSession(
    userId: string,
    userEmail: string,
    planTier: SubscriptionTier,
    billingInterval: 'monthly' | 'annual',
    successUrl: string,
    cancelUrl: string
  ): Promise<{ sessionId: string; url: string }> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    // Get the plan
    const plan = await this.getPlanByTier(planTier);
    if (!plan) {
      throw new Error(`Plan not found for tier: ${planTier}`);
    }

    // Check if user already has a Stripe customer ID
    let stripeCustomerId = await this.getStripeCustomerId(userId);

    // Create customer if doesn't exist
    if (!stripeCustomerId) {
      const customer = await this.stripe.customers.create({
        email: userEmail,
        metadata: { userId },
      });
      stripeCustomerId = customer.id;
    }

    // Get the appropriate price ID
    const priceId = billingInterval === 'annual'
      ? plan.stripe_price_id_annual
      : plan.stripe_price_id_monthly;

    if (!priceId) {
      // If no Stripe price ID, create a price on the fly (for development)
      const price = await this.createStripePrice(plan, billingInterval);
      await this.updatePlanStripeIds(plan.id, billingInterval, price.id);
    }

    // Create checkout session
    const session = await this.stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId || undefined,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        planId: plan.id,
        planTier: plan.tier,
        billingInterval,
      },
      subscription_data: {
        metadata: {
          userId,
          planId: plan.id,
        },
      },
      allow_promotion_codes: true,
    });

    return {
      sessionId: session.id,
      url: session.url || '',
    };
  }

  /**
   * Create a Stripe billing portal session
   */
  async createBillingPortalSession(
    userId: string,
    returnUrl: string
  ): Promise<{ url: string }> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    const stripeCustomerId = await this.getStripeCustomerId(userId);
    if (!stripeCustomerId) {
      throw new Error('No Stripe customer found for user');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  }

  // ============================================================================
  // WEBHOOK HANDLERS
  // ============================================================================

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }
  }

  /**
   * Handle checkout session completed
   */
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;
    // billingInterval is stored in metadata for reference but handled by subscription webhook
    // const billingInterval = session.metadata?.billingInterval as 'monthly' | 'annual';

    if (!userId || !planId) {
      console.error('Missing metadata in checkout session');
      return;
    }

    // The subscription will be created by the subscription.created webhook
    // But we can update user profile tier here
    const plan = await this.getPlanById(planId);
    if (plan) {
      await pool.query(
        `UPDATE user_profiles SET subscription_tier = $1 WHERE user_id = $2`,
        [plan.tier, userId]
      );
    }
  }

  /**
   * Handle subscription created/updated
   */
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata?.userId;
    const planId = subscription.metadata?.planId;

    if (!userId || !planId) {
      console.error('Missing metadata in subscription');
      return;
    }

    // Map Stripe status to our status
    const status = this.mapStripeStatus(subscription.status);

    // Get period dates from the first subscription item
    const firstItem = subscription.items.data[0];
    const periodStart = firstItem?.current_period_start
      ? new Date(firstItem.current_period_start * 1000)
      : null;
    const periodEnd = firstItem?.current_period_end
      ? new Date(firstItem.current_period_end * 1000)
      : null;

    // Upsert subscription
    await pool.query(
      `INSERT INTO subscriptions (
        user_id, plan_id, stripe_subscription_id, stripe_customer_id,
        status, billing_interval, current_period_start, current_period_end,
        cancel_at_period_end
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (user_id) DO UPDATE SET
        plan_id = EXCLUDED.plan_id,
        stripe_subscription_id = EXCLUDED.stripe_subscription_id,
        status = EXCLUDED.status,
        current_period_start = EXCLUDED.current_period_start,
        current_period_end = EXCLUDED.current_period_end,
        cancel_at_period_end = EXCLUDED.cancel_at_period_end,
        updated_at = NOW()`,
      [
        userId,
        planId,
        subscription.id,
        subscription.customer as string,
        status,
        firstItem?.plan?.interval === 'year' ? 'annual' : 'monthly',
        periodStart,
        periodEnd,
        subscription.cancel_at_period_end,
      ]
    );

    // Update user profile tier
    const plan = await this.getPlanById(planId);
    if (plan && status === 'active') {
      await pool.query(
        `UPDATE user_profiles SET subscription_tier = $1 WHERE user_id = $2`,
        [plan.tier, userId]
      );
    }
  }

  /**
   * Handle subscription deleted/canceled
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata?.userId;

    if (!userId) {
      console.error('Missing userId in subscription metadata');
      return;
    }

    // Update subscription status
    await pool.query(
      `UPDATE subscriptions
       SET status = 'canceled', canceled_at = NOW()
       WHERE stripe_subscription_id = $1`,
      [subscription.id]
    );

    // Downgrade user to starter
    await pool.query(
      `UPDATE user_profiles SET subscription_tier = 'starter' WHERE user_id = $1`,
      [userId]
    );
  }

  /**
   * Handle invoice paid
   */
  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    // Get subscription ID from parent details (new API structure)
    const stripeSubscriptionId = typeof invoice.parent?.subscription_details?.subscription === 'string'
      ? invoice.parent.subscription_details.subscription
      : invoice.parent?.subscription_details?.subscription?.id;

    if (!stripeSubscriptionId) return;

    const subscriptionResult = await pool.query(
      `SELECT id FROM subscriptions WHERE stripe_subscription_id = $1`,
      [stripeSubscriptionId]
    );

    if (subscriptionResult.rows.length === 0) return;

    const subscriptionId = subscriptionResult.rows[0].id;

    // Get charge ID from error if available (successful invoices typically don't have this)
    const chargeId = invoice.last_finalization_error?.charge || null;

    await pool.query(
      `INSERT INTO billing_transactions (
        subscription_id, stripe_invoice_id, stripe_charge_id,
        amount, currency, status, description, billing_date, paid_at,
        receipt_url, invoice_pdf_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (stripe_invoice_id) DO UPDATE SET
        status = EXCLUDED.status,
        paid_at = EXCLUDED.paid_at,
        receipt_url = EXCLUDED.receipt_url,
        invoice_pdf_url = EXCLUDED.invoice_pdf_url`,
      [
        subscriptionId,
        invoice.id,
        chargeId,
        (invoice.amount_paid || 0) / 100,
        invoice.currency.toUpperCase(),
        'paid',
        invoice.description || `Subscription payment`,
        new Date((invoice.created || Date.now() / 1000) * 1000),
        new Date(),
        invoice.hosted_invoice_url,
        invoice.invoice_pdf,
      ]
    );
  }

  /**
   * Handle invoice payment failed
   */
  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    // Get subscription ID from parent details (new API structure)
    const stripeSubscriptionId = typeof invoice.parent?.subscription_details?.subscription === 'string'
      ? invoice.parent.subscription_details.subscription
      : invoice.parent?.subscription_details?.subscription?.id;

    if (!stripeSubscriptionId) return;

    const subscriptionResult = await pool.query(
      `SELECT id FROM subscriptions WHERE stripe_subscription_id = $1`,
      [stripeSubscriptionId]
    );

    if (subscriptionResult.rows.length === 0) return;

    const subscriptionId = subscriptionResult.rows[0].id;
    const chargeId = invoice.last_finalization_error?.charge || null;

    await pool.query(
      `INSERT INTO billing_transactions (
        subscription_id, stripe_invoice_id, stripe_charge_id,
        amount, currency, status, description, billing_date, failure_reason
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (stripe_invoice_id) DO UPDATE SET
        status = EXCLUDED.status,
        failure_reason = EXCLUDED.failure_reason`,
      [
        subscriptionId,
        invoice.id,
        chargeId,
        (invoice.amount_due || 0) / 100,
        invoice.currency.toUpperCase(),
        'failed',
        invoice.description || `Subscription payment`,
        new Date((invoice.created || Date.now() / 1000) * 1000),
        invoice.last_finalization_error?.message || 'Payment failed',
      ]
    );

    // Update subscription status
    await pool.query(
      `UPDATE subscriptions SET status = 'past_due' WHERE stripe_subscription_id = $1`,
      [stripeSubscriptionId]
    );
  }

  // ============================================================================
  // BILLING HISTORY
  // ============================================================================

  /**
   * Get billing history for a user
   */
  async getBillingHistory(userId: string): Promise<BillingTransaction[]> {
    const result = await pool.query<BillingTransaction>(
      `SELECT bt.*
       FROM billing_transactions bt
       JOIN subscriptions s ON bt.subscription_id = s.id
       WHERE s.user_id = $1
       ORDER BY bt.billing_date DESC
       LIMIT 50`,
      [userId]
    );
    return result.rows;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Get Stripe customer ID for a user
   */
  private async getStripeCustomerId(userId: string): Promise<string | null> {
    const result = await pool.query(
      `SELECT stripe_customer_id FROM subscriptions WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0]?.stripe_customer_id || null;
  }

  /**
   * Create a Stripe price for a plan
   */
  private async createStripePrice(
    plan: SubscriptionPlan,
    interval: 'monthly' | 'annual'
  ): Promise<Stripe.Price> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    // Create product if needed
    let productId = plan.stripe_product_id;
    if (!productId) {
      const product = await this.stripe.products.create({
        name: `${plan.name} Plan`,
        description: plan.description,
        metadata: { tier: plan.tier },
      });
      productId = product.id;
      await pool.query(
        `UPDATE subscription_plans SET stripe_product_id = $1 WHERE id = $2`,
        [productId, plan.id]
      );
    }

    const price = await this.stripe.prices.create({
      product: productId,
      unit_amount: Math.round(
        (interval === 'annual' ? plan.price_annually || plan.price_monthly * 10 : plan.price_monthly) * 100
      ),
      currency: 'usd',
      recurring: {
        interval: interval === 'annual' ? 'year' : 'month',
      },
      metadata: {
        planId: plan.id,
        tier: plan.tier,
      },
    });

    return price;
  }

  /**
   * Update plan with Stripe price IDs
   */
  private async updatePlanStripeIds(
    planId: string,
    interval: 'monthly' | 'annual',
    priceId: string
  ): Promise<void> {
    const column = interval === 'annual' ? 'stripe_price_id_annual' : 'stripe_price_id_monthly';
    await pool.query(
      `UPDATE subscription_plans SET ${column} = $1 WHERE id = $2`,
      [priceId, planId]
    );
  }

  /**
   * Map Stripe subscription status to our status
   */
  private mapStripeStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
    const statusMap: Record<string, SubscriptionStatus> = {
      active: 'active',
      canceled: 'canceled',
      past_due: 'past_due',
      unpaid: 'unpaid',
      trialing: 'trialing',
      incomplete: 'incomplete',
      incomplete_expired: 'incomplete_expired',
      paused: 'canceled',
    };
    return statusMap[stripeStatus] || 'active';
  }

  /**
   * Transform database plan row to SubscriptionPlan
   */
  private transformPlan(row: any): SubscriptionPlan {
    return {
      ...row,
      price_monthly: parseFloat(row.price_monthly),
      price_annually: row.price_annually ? parseFloat(row.price_annually) : null,
      features: typeof row.features === 'string' ? JSON.parse(row.features) : row.features,
      limits: typeof row.limits === 'string' ? JSON.parse(row.limits) : row.limits,
    };
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();
