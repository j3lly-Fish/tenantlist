import { Pool } from 'pg';
import { MigrationRunner } from '../../database/migrations/migration-runner';
import { migrations } from '../../database/migrations';

// Test database configuration
const testPool = new Pool({
  host: process.env.TEST_DATABASE_HOST || 'localhost',
  port: parseInt(process.env.TEST_DATABASE_PORT || '5432', 10),
  database: process.env.TEST_DATABASE_NAME || 'zyx_test',
  user: process.env.TEST_DATABASE_USER || 'postgres',
  password: process.env.TEST_DATABASE_PASSWORD || 'postgres',
});

describe('Broker Profile Database Migration', () => {
  let testBrokerUserId: string;
  let testTenantUserId: string;

  beforeAll(async () => {
    // Run migrations on test database
    const migrationRunner = new MigrationRunner(testPool);
    await migrationRunner.createMigrationsTable();
    await migrationRunner.runMigrations(migrations);

    // Create test broker user
    const brokerResult = await testPool.query(
      `INSERT INTO users (email, password_hash, role, email_verified) VALUES ($1, $2, $3, $4) RETURNING id`,
      ['test-broker@example.com', 'hash123', 'broker', true]
    );
    testBrokerUserId = brokerResult.rows[0].id;

    // Create test tenant user (for constraint testing)
    const tenantResult = await testPool.query(
      `INSERT INTO users (email, password_hash, role, email_verified) VALUES ($1, $2, $3, $4) RETURNING id`,
      ['test-tenant@example.com', 'hash456', 'tenant', true]
    );
    testTenantUserId = tenantResult.rows[0].id;
  });

  afterAll(async () => {
    // Clean up test database
    await testPool.query('DROP SCHEMA public CASCADE');
    await testPool.query('CREATE SCHEMA public');
    await testPool.end();
  });

  beforeEach(async () => {
    // Clean up broker profiles before each test
    await testPool.query('DELETE FROM broker_profiles');
  });

  describe('Test 1: broker profile creation', () => {
    it('should create a broker profile with all fields', async () => {
      const profileData = {
        user_id: testBrokerUserId,
        company_name: 'Test Brokerage LLC',
        license_number: 'BRK123456',
        license_state: 'CA',
        specialties: ['retail', 'office'],
        bio: 'Experienced commercial real estate broker',
        website_url: 'https://testbrokerage.com',
        years_experience: 10,
      };

      const result = await testPool.query(
        `INSERT INTO broker_profiles
         (user_id, company_name, license_number, license_state, specialties, bio, website_url, years_experience)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          profileData.user_id,
          profileData.company_name,
          profileData.license_number,
          profileData.license_state,
          profileData.specialties,
          profileData.bio,
          profileData.website_url,
          profileData.years_experience,
        ]
      );

      const profile = result.rows[0];

      expect(profile).toBeDefined();
      expect(profile.id).toBeDefined();
      expect(profile.user_id).toBe(testBrokerUserId);
      expect(profile.company_name).toBe('Test Brokerage LLC');
      expect(profile.license_number).toBe('BRK123456');
      expect(profile.license_state).toBe('CA');
      expect(profile.specialties).toEqual(['retail', 'office']);
      expect(profile.bio).toBe('Experienced commercial real estate broker');
      expect(profile.website_url).toBe('https://testbrokerage.com');
      expect(profile.years_experience).toBe(10);
      expect(profile.total_deals_closed).toBe(0); // Default value
      expect(profile.total_commission_earned).toBe('0.00'); // Default value
      expect(profile.created_at).toBeDefined();
      expect(profile.updated_at).toBeDefined();
    });

    it('should create a broker profile with minimal required fields', async () => {
      const result = await testPool.query(
        `INSERT INTO broker_profiles (user_id, company_name)
         VALUES ($1, $2)
         RETURNING *`,
        [testBrokerUserId, 'Minimal Brokerage']
      );

      const profile = result.rows[0];

      expect(profile).toBeDefined();
      expect(profile.company_name).toBe('Minimal Brokerage');
      expect(profile.license_number).toBeNull();
      expect(profile.specialties).toBeNull();
      expect(profile.bio).toBeNull();
      expect(profile.total_deals_closed).toBe(0);
    });
  });

  describe('Test 2: broker profile updates', () => {
    it('should update broker profile fields', async () => {
      // Create profile
      const createResult = await testPool.query(
        `INSERT INTO broker_profiles (user_id, company_name, years_experience)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [testBrokerUserId, 'Original Company', 5]
      );

      const profileId = createResult.rows[0].id;

      // Update profile
      await testPool.query(
        `UPDATE broker_profiles
         SET company_name = $1, years_experience = $2, license_number = $3, updated_at = NOW()
         WHERE id = $4`,
        ['Updated Company', 7, 'LIC789', profileId]
      );

      // Fetch updated profile
      const result = await testPool.query(
        'SELECT * FROM broker_profiles WHERE id = $1',
        [profileId]
      );

      const profile = result.rows[0];

      expect(profile.company_name).toBe('Updated Company');
      expect(profile.years_experience).toBe(7);
      expect(profile.license_number).toBe('LIC789');
    });

    it('should update deals stats when deals are completed', async () => {
      // Create profile
      const createResult = await testPool.query(
        `INSERT INTO broker_profiles (user_id, company_name)
         VALUES ($1, $2)
         RETURNING id`,
        [testBrokerUserId, 'Stats Test Brokerage']
      );

      const profileId = createResult.rows[0].id;

      // Simulate deal completion - update stats
      await testPool.query(
        `UPDATE broker_profiles
         SET total_deals_closed = total_deals_closed + 1,
             total_commission_earned = total_commission_earned + 5000.00
         WHERE id = $1`,
        [profileId]
      );

      // Fetch updated profile
      const result = await testPool.query(
        'SELECT total_deals_closed, total_commission_earned FROM broker_profiles WHERE id = $1',
        [profileId]
      );

      expect(result.rows[0].total_deals_closed).toBe(1);
      expect(parseFloat(result.rows[0].total_commission_earned)).toBe(5000.00);
    });
  });

  describe('Test 3: fetching broker profile by user_id', () => {
    it('should fetch broker profile by user_id', async () => {
      // Create profile
      await testPool.query(
        `INSERT INTO broker_profiles (user_id, company_name, license_number)
         VALUES ($1, $2, $3)`,
        [testBrokerUserId, 'Fetch Test Brokerage', 'FETCH123']
      );

      // Fetch by user_id
      const result = await testPool.query(
        'SELECT * FROM broker_profiles WHERE user_id = $1',
        [testBrokerUserId]
      );

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].company_name).toBe('Fetch Test Brokerage');
      expect(result.rows[0].license_number).toBe('FETCH123');
    });

    it('should return empty result for non-existent user_id', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000';

      const result = await testPool.query(
        'SELECT * FROM broker_profiles WHERE user_id = $1',
        [fakeUserId]
      );

      expect(result.rows.length).toBe(0);
    });
  });

  describe('Test 4: broker profile constraints', () => {
    it('should enforce unique constraint on user_id', async () => {
      // Create first profile
      await testPool.query(
        `INSERT INTO broker_profiles (user_id, company_name)
         VALUES ($1, $2)`,
        [testBrokerUserId, 'First Brokerage']
      );

      // Attempt to create duplicate profile for same user
      await expect(
        testPool.query(
          `INSERT INTO broker_profiles (user_id, company_name)
           VALUES ($1, $2)`,
          [testBrokerUserId, 'Duplicate Brokerage']
        )
      ).rejects.toThrow();
    });

    it('should cascade delete broker profile when user is deleted', async () => {
      // Create a temporary user for this test
      const tempUserResult = await testPool.query(
        `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id`,
        ['temp-broker@example.com', 'hash789', 'broker']
      );
      const tempUserId = tempUserResult.rows[0].id;

      // Create broker profile for temp user
      await testPool.query(
        `INSERT INTO broker_profiles (user_id, company_name)
         VALUES ($1, $2)`,
        [tempUserId, 'Temp Brokerage']
      );

      // Verify profile exists
      let result = await testPool.query(
        'SELECT * FROM broker_profiles WHERE user_id = $1',
        [tempUserId]
      );
      expect(result.rows.length).toBe(1);

      // Delete user (should cascade to broker_profiles)
      await testPool.query('DELETE FROM users WHERE id = $1', [tempUserId]);

      // Verify profile was deleted
      result = await testPool.query(
        'SELECT * FROM broker_profiles WHERE user_id = $1',
        [tempUserId]
      );
      expect(result.rows.length).toBe(0);
    });

    it('should require company_name (NOT NULL constraint)', async () => {
      await expect(
        testPool.query(
          `INSERT INTO broker_profiles (user_id) VALUES ($1)`,
          [testBrokerUserId]
        )
      ).rejects.toThrow();
    });
  });
});
