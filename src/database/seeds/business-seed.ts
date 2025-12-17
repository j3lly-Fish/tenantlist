import { Pool } from 'pg';
import pool from '../../config/database';
import { BusinessModel } from '../models/Business';
import { BusinessLocationModel } from '../models/BusinessLocation';
import { BusinessMetricsModel } from '../models/BusinessMetrics';
import { UserModel } from '../models/User';
import { BusinessStatus, UserRole } from '../../types';

/**
 * Business Seed Data
 * Creates sample businesses, locations, and metrics for development and testing
 */

export async function seedBusinessData(): Promise<void> {
  const businessModel = new BusinessModel(pool);
  const locationModel = new BusinessLocationModel(pool);
  const metricsModel = new BusinessMetricsModel(pool);
  const userModel = new UserModel(pool);

  console.log('Starting business data seeding...');

  try {
    // Find or create test tenant users
    let testUser1 = await userModel.findByEmail('tenant1@test.com');
    if (!testUser1) {
      testUser1 = await userModel.create({
        email: 'tenant1@test.com',
        password_hash: '$2b$10$abcdefghijklmnopqrstuvwxyz', // dummy hash
        role: UserRole.TENANT,
        email_verified: true,
      });
      console.log('Created test user: tenant1@test.com');
    }

    let testUser2 = await userModel.findByEmail('tenant2@test.com');
    if (!testUser2) {
      testUser2 = await userModel.create({
        email: 'tenant2@test.com',
        password_hash: '$2b$10$abcdefghijklmnopqrstuvwxyz', // dummy hash
        role: UserRole.TENANT,
        email_verified: true,
      });
      console.log('Created test user: tenant2@test.com');
    }

    // Seed businesses for user 1
    console.log('Seeding businesses for tenant1@test.com...');

    // Business 1: Active F&B
    const business1 = await businessModel.create({
      user_id: testUser1.id,
      name: 'The Daily Grind Coffee',
      category: 'F&B',
      status: BusinessStatus.ACTIVE,
      is_verified: true,
    });
    console.log(`  Created business: ${business1.name}`);

    const b1_location1 = await locationModel.create({
      business_id: business1.id,
      city: 'Miami',
      state: 'FL',
      address: '123 Brickell Ave, Miami, FL 33131',
    });

    const b1_location2 = await locationModel.create({
      business_id: business1.id,
      city: 'Fort Lauderdale',
      state: 'FL',
      address: '456 Las Olas Blvd, Fort Lauderdale, FL 33301',
    });

    // Add metrics for business 1
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    await metricsModel.create({
      business_id: business1.id,
      demand_listing_id: b1_location1.id,
      metric_date: today,
      views_count: 250,
      clicks_count: 75,
      property_invites_count: 15,
      declined_count: 3,
      messages_count: 12,
      qfps_submitted_count: 5,
    });

    await metricsModel.create({
      business_id: business1.id,
      demand_listing_id: b1_location1.id,
      metric_date: yesterday,
      views_count: 180,
      clicks_count: 50,
      property_invites_count: 10,
      declined_count: 2,
      messages_count: 8,
      qfps_submitted_count: 3,
    });

    await metricsModel.create({
      business_id: business1.id,
      demand_listing_id: b1_location2.id,
      metric_date: today,
      views_count: 120,
      clicks_count: 35,
      property_invites_count: 8,
      declined_count: 1,
      messages_count: 5,
      qfps_submitted_count: 2,
    });

    // Business 2: Active Retail
    const business2 = await businessModel.create({
      user_id: testUser1.id,
      name: 'Urban Fashion Boutique',
      category: 'Retail',
      status: BusinessStatus.ACTIVE,
      is_verified: true,
    });
    console.log(`  Created business: ${business2.name}`);

    const b2_location1 = await locationModel.create({
      business_id: business2.id,
      city: 'New York',
      state: 'NY',
      address: '789 5th Ave, New York, NY 10022',
    });

    await metricsModel.create({
      business_id: business2.id,
      demand_listing_id: b2_location1.id,
      metric_date: today,
      views_count: 310,
      clicks_count: 95,
      property_invites_count: 20,
      declined_count: 4,
      messages_count: 15,
      qfps_submitted_count: 7,
    });

    await metricsModel.create({
      business_id: business2.id,
      demand_listing_id: b2_location1.id,
      metric_date: yesterday,
      views_count: 275,
      clicks_count: 80,
      property_invites_count: 18,
      declined_count: 3,
      messages_count: 12,
      qfps_submitted_count: 6,
    });

    // Business 3: Pending Verification
    const business3 = await businessModel.create({
      user_id: testUser1.id,
      name: 'Tech Hub Coworking',
      category: 'Office',
      status: BusinessStatus.PENDING_VERIFICATION,
      is_verified: false,
    });
    console.log(`  Created business: ${business3.name}`);

    const b3_location1 = await locationModel.create({
      business_id: business3.id,
      city: 'Austin',
      state: 'TX',
      address: null,
    });

    await metricsModel.create({
      business_id: business3.id,
      demand_listing_id: b3_location1.id,
      metric_date: today,
      views_count: 45,
      clicks_count: 12,
      property_invites_count: 2,
      declined_count: 0,
      messages_count: 1,
      qfps_submitted_count: 0,
    });

    // Business 4: Stealth Mode
    const business4 = await businessModel.create({
      user_id: testUser1.id,
      name: 'Elite Fitness Studio',
      category: 'Healthcare',
      status: BusinessStatus.STEALTH_MODE,
      is_verified: false,
    });
    console.log(`  Created business: ${business4.name}`);

    const b4_location1 = await locationModel.create({
      business_id: business4.id,
      city: 'Los Angeles',
      state: 'CA',
      address: '101 Sunset Blvd, Los Angeles, CA 90028',
    });

    await metricsModel.create({
      business_id: business4.id,
      demand_listing_id: b4_location1.id,
      metric_date: today,
      views_count: 10,
      clicks_count: 3,
      property_invites_count: 0,
      declined_count: 0,
      messages_count: 0,
      qfps_submitted_count: 0,
    });

    // Business 5: Active Office Space
    const business5 = await businessModel.create({
      user_id: testUser1.id,
      name: 'Innovation Labs Inc',
      category: 'Office',
      status: BusinessStatus.ACTIVE,
      is_verified: true,
    });
    console.log(`  Created business: ${business5.name}`);

    const b5_location1 = await locationModel.create({
      business_id: business5.id,
      city: 'Seattle',
      state: 'WA',
      address: '500 Pike St, Seattle, WA 98101',
    });

    const b5_location2 = await locationModel.create({
      business_id: business5.id,
      city: 'Portland',
      state: 'OR',
      address: null,
    });

    await metricsModel.create({
      business_id: business5.id,
      demand_listing_id: b5_location1.id,
      metric_date: today,
      views_count: 190,
      clicks_count: 60,
      property_invites_count: 12,
      declined_count: 2,
      messages_count: 9,
      qfps_submitted_count: 4,
    });

    await metricsModel.create({
      business_id: business5.id,
      demand_listing_id: b5_location2.id,
      metric_date: today,
      views_count: 85,
      clicks_count: 25,
      property_invites_count: 5,
      declined_count: 1,
      messages_count: 3,
      qfps_submitted_count: 1,
    });

    // Seed businesses for user 2
    console.log('Seeding businesses for tenant2@test.com...');

    // Business 6: Active F&B
    const business6 = await businessModel.create({
      user_id: testUser2.id,
      name: 'Mediterranean Bistro',
      category: 'F&B',
      status: BusinessStatus.ACTIVE,
      is_verified: true,
    });
    console.log(`  Created business: ${business6.name}`);

    const b6_location1 = await locationModel.create({
      business_id: business6.id,
      city: 'Boston',
      state: 'MA',
      address: '200 Newbury St, Boston, MA 02116',
    });

    await metricsModel.create({
      business_id: business6.id,
      demand_listing_id: b6_location1.id,
      metric_date: today,
      views_count: 220,
      clicks_count: 68,
      property_invites_count: 14,
      declined_count: 3,
      messages_count: 10,
      qfps_submitted_count: 4,
    });

    // Business 7: Active Retail
    const business7 = await businessModel.create({
      user_id: testUser2.id,
      name: 'Artisan Craft Market',
      category: 'Retail',
      status: BusinessStatus.ACTIVE,
      is_verified: true,
    });
    console.log(`  Created business: ${business7.name}`);

    const b7_location1 = await locationModel.create({
      business_id: business7.id,
      city: 'Chicago',
      state: 'IL',
      address: '300 Michigan Ave, Chicago, IL 60601',
    });

    await metricsModel.create({
      business_id: business7.id,
      demand_listing_id: b7_location1.id,
      metric_date: today,
      views_count: 165,
      clicks_count: 52,
      property_invites_count: 11,
      declined_count: 2,
      messages_count: 7,
      qfps_submitted_count: 3,
    });

    // Business 8: Pending Verification
    const business8 = await businessModel.create({
      user_id: testUser2.id,
      name: 'Premium Car Wash',
      category: 'Other',
      status: BusinessStatus.PENDING_VERIFICATION,
      is_verified: false,
    });
    console.log(`  Created business: ${business8.name}`);

    const b8_location1 = await locationModel.create({
      business_id: business8.id,
      city: 'Denver',
      state: 'CO',
      address: null,
    });

    await metricsModel.create({
      business_id: business8.id,
      demand_listing_id: b8_location1.id,
      metric_date: today,
      views_count: 30,
      clicks_count: 8,
      property_invites_count: 1,
      declined_count: 0,
      messages_count: 0,
      qfps_submitted_count: 0,
    });

    console.log('\nBusiness data seeding completed successfully!');
    console.log(`Total businesses created: 8`);
    console.log(`Total locations created: 11`);
    console.log(`Total metrics entries created: 12`);
  } catch (error) {
    console.error('Error seeding business data:', error);
    throw error;
  }
}

// Run seed if executed directly
if (require.main === module) {
  seedBusinessData()
    .then(() => {
      console.log('\nSeed completed. Closing database connection...');
      pool.end();
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nSeed failed:', error);
      pool.end();
      process.exit(1);
    });
}
