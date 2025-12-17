import { Pool } from 'pg';
import { Migration } from './migration-runner';

/**
 * Migration: Create subscription-related tables
 *
 * Creates tables for:
 * - subscription_plans: Available subscription tiers with Stripe IDs
 * - subscriptions: User subscription records
 * - billing_transactions: Payment history
 */
export const createSubscriptionsTablesMigration: Migration = {
  name: '019-create-subscriptions-tables',

  async up(pool: Pool): Promise<void> {
    // Create subscription_plans table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tier subscription_tier UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        price_monthly DECIMAL(10, 2) NOT NULL,
        price_annually DECIMAL(10, 2),
        description TEXT,
        features JSONB NOT NULL DEFAULT '[]',
        limits JSONB NOT NULL DEFAULT '{}',
        stripe_product_id VARCHAR(100) UNIQUE,
        stripe_price_id_monthly VARCHAR(100),
        stripe_price_id_annual VARCHAR(100),
        is_active BOOLEAN NOT NULL DEFAULT true,
        display_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create subscriptions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan_id UUID NOT NULL REFERENCES subscription_plans(id),
        stripe_subscription_id VARCHAR(100) UNIQUE,
        stripe_customer_id VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        billing_interval VARCHAR(20) NOT NULL DEFAULT 'monthly',
        current_period_start TIMESTAMP WITH TIME ZONE,
        current_period_end TIMESTAMP WITH TIME ZONE,
        canceled_at TIMESTAMP WITH TIME ZONE,
        cancel_at_period_end BOOLEAN DEFAULT FALSE,
        trial_start TIMESTAMP WITH TIME ZONE,
        trial_end TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      );
    `);

    // Create billing_transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS billing_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
        stripe_invoice_id VARCHAR(100) UNIQUE,
        stripe_charge_id VARCHAR(100),
        stripe_payment_intent_id VARCHAR(100),
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'USD',
        status VARCHAR(50) NOT NULL,
        description TEXT,
        billing_date TIMESTAMP WITH TIME ZONE NOT NULL,
        paid_at TIMESTAMP WITH TIME ZONE,
        failure_reason TEXT,
        receipt_url VARCHAR(500),
        invoice_pdf_url VARCHAR(500),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
      CREATE INDEX IF NOT EXISTS idx_billing_transactions_subscription_id ON billing_transactions(subscription_id);
      CREATE INDEX IF NOT EXISTS idx_billing_transactions_stripe_invoice_id ON billing_transactions(stripe_invoice_id);
    `);

    // Create triggers for updated_at
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_subscription_plans_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE OR REPLACE FUNCTION update_billing_transactions_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trigger_update_subscription_plans_updated_at ON subscription_plans;
      DROP TRIGGER IF EXISTS trigger_update_subscriptions_updated_at ON subscriptions;
      DROP TRIGGER IF EXISTS trigger_update_billing_transactions_updated_at ON billing_transactions;

      CREATE TRIGGER trigger_update_subscription_plans_updated_at
        BEFORE UPDATE ON subscription_plans
        FOR EACH ROW
        EXECUTE FUNCTION update_subscription_plans_updated_at();

      CREATE TRIGGER trigger_update_subscriptions_updated_at
        BEFORE UPDATE ON subscriptions
        FOR EACH ROW
        EXECUTE FUNCTION update_subscriptions_updated_at();

      CREATE TRIGGER trigger_update_billing_transactions_updated_at
        BEFORE UPDATE ON billing_transactions
        FOR EACH ROW
        EXECUTE FUNCTION update_billing_transactions_updated_at();
    `);

    // Seed default subscription plans
    await pool.query(`
      INSERT INTO subscription_plans (tier, name, price_monthly, price_annually, description, features, limits, display_order)
      VALUES
        ('starter', 'Starter', 0.00, 0.00, 'Perfect for small businesses getting started',
         '["Smart Matching Engine", "Role-Based Dashboard", "Direct Messaging", "Document Center (Receive Only)", "Basic Market Insights"]'::jsonb,
         '{"locations": 2, "qfps": 3, "team_members": 1}'::jsonb,
         1),
        ('pro', 'Pro', 99.00, 990.00, 'For growing businesses expanding their reach',
         '["Everything in Starter", "Team Hierarchy (2-Layer)", "Kanban Deal Pipeline", "Broker Collaboration", "Calendar Integration", "Saved Searches & Alerts", "Document Center (Collaborate)"]'::jsonb,
         '{"locations": 10, "qfps": 10, "team_members": 5}'::jsonb,
         2),
        ('premium', 'Premium', 199.00, 1990.00, 'For regional brands with advanced needs',
         '["Everything in Pro", "AI Scoring & Demographics", "Drive-Time Analysis", "Heatmaps & Competitive Intel", "Anonymous/Stealth Mode", "Contact Unlocking", "Video Profiles", "Lease Expiry Alerts"]'::jsonb,
         '{"locations": 50, "qfps": 50, "team_members": 20}'::jsonb,
         3),
        ('enterprise', 'Enterprise', 999.00, 9990.00, 'For national brands with unlimited needs',
         '["Everything in Premium", "Unlimited Locations", "3-Layer Team Hierarchy", "Competitor Location Metrics", "Page View Tracking", "Multi-Listing Comparison", "Dedicated Support Agent", "Custom Integrations"]'::jsonb,
         '{"locations": -1, "qfps": -1, "team_members": -1}'::jsonb,
         4)
      ON CONFLICT (tier) DO UPDATE SET
        name = EXCLUDED.name,
        price_monthly = EXCLUDED.price_monthly,
        price_annually = EXCLUDED.price_annually,
        description = EXCLUDED.description,
        features = EXCLUDED.features,
        limits = EXCLUDED.limits,
        display_order = EXCLUDED.display_order;
    `);

    console.log('Created subscription tables with indexes, triggers, and seeded plans');
  },

  async down(pool: Pool): Promise<void> {
    await pool.query(`
      DROP TRIGGER IF EXISTS trigger_update_billing_transactions_updated_at ON billing_transactions;
      DROP TRIGGER IF EXISTS trigger_update_subscriptions_updated_at ON subscriptions;
      DROP TRIGGER IF EXISTS trigger_update_subscription_plans_updated_at ON subscription_plans;
      DROP FUNCTION IF EXISTS update_billing_transactions_updated_at;
      DROP FUNCTION IF EXISTS update_subscriptions_updated_at;
      DROP FUNCTION IF EXISTS update_subscription_plans_updated_at;
      DROP TABLE IF EXISTS billing_transactions CASCADE;
      DROP TABLE IF EXISTS subscriptions CASCADE;
      DROP TABLE IF EXISTS subscription_plans CASCADE;
    `);

    console.log('Dropped subscription tables');
  },
};
