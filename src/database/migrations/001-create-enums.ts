import { Pool } from 'pg';
import { Migration } from './migration-runner';

// Migration to create PostgreSQL enum types
export const createEnumsMigration: Migration = {
  name: '001-create-enums',

  async up(pool: Pool): Promise<void> {
    // Create user_role enum
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('tenant', 'landlord', 'broker');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create oauth_provider enum
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE oauth_provider AS ENUM ('google', 'facebook', 'twitter');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create business_status enum
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE business_status AS ENUM ('active', 'pending_verification', 'stealth_mode');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create demand_listing_status enum
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE demand_listing_status AS ENUM ('active', 'pending', 'closed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create business_invite_status enum
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE business_invite_status AS ENUM ('pending', 'accepted', 'declined');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create subscription_tier enum
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE subscription_tier AS ENUM ('starter', 'pro', 'premium', 'enterprise');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
  },

  async down(pool: Pool): Promise<void> {
    await pool.query('DROP TYPE IF EXISTS subscription_tier CASCADE');
    await pool.query('DROP TYPE IF EXISTS business_invite_status CASCADE');
    await pool.query('DROP TYPE IF EXISTS demand_listing_status CASCADE');
    await pool.query('DROP TYPE IF EXISTS business_status CASCADE');
    await pool.query('DROP TYPE IF EXISTS oauth_provider CASCADE');
    await pool.query('DROP TYPE IF EXISTS user_role CASCADE');
  },
};
