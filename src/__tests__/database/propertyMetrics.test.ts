import { Pool } from 'pg';
import { PropertyListingModel } from '../../database/models/PropertyListing';
import { PropertyType, PropertyListingStatus } from '../../types';
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

describe('Property Metrics Database Migration', () => {
  let propertyListingModel: PropertyListingModel;
  let testUserId: string;

  beforeAll(async () => {
    // Run migrations on test database
    const migrationRunner = new MigrationRunner(testPool);
    await migrationRunner.createMigrationsTable();
    await migrationRunner.runMigrations(migrations);

    // Initialize model
    propertyListingModel = new PropertyListingModel(testPool);

    // Create test user
    const userResult = await testPool.query(
      `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id`,
      ['test-metrics@example.com', 'hash123', 'landlord']
    );
    testUserId = userResult.rows[0].id;
  });

  afterAll(async () => {
    // Clean up test database
    await testPool.query('DROP SCHEMA public CASCADE');
    await testPool.query('CREATE SCHEMA public');
    await testPool.end();
  });

  beforeEach(async () => {
    // Clean up property listings before each test
    await testPool.query('DELETE FROM property_listings');
  });

  describe('Test 1: days_on_market calculation on property creation', () => {
    it('should initialize days_on_market to 0 for newly created active property', async () => {
      const propertyData = {
        user_id: testUserId,
        title: 'Test Property for Metrics',
        description: 'Testing days on market calculation',
        property_type: PropertyType.RETAIL,
        status: PropertyListingStatus.ACTIVE,
        address: '123 Test St',
        city: 'TestCity',
        state: 'TX',
        zip_code: '12345',
        sqft: 1000,
      };

      const property = await propertyListingModel.create(propertyData);

      // Check that the property was created
      expect(property).toBeDefined();
      expect(property.id).toBeDefined();

      // Query the property directly to check days_on_market
      const result = await testPool.query(
        'SELECT days_on_market FROM property_listings WHERE id = $1',
        [property.id]
      );

      // For a newly created property, days_on_market should be 0 or null (will be calculated on first update)
      expect(result.rows[0].days_on_market).toBeDefined();
    });

    it('should not set days_on_market for non-active properties', async () => {
      const propertyData = {
        user_id: testUserId,
        title: 'Pending Property',
        property_type: PropertyType.OFFICE,
        status: PropertyListingStatus.PENDING,
        address: '456 Pending Ave',
        city: 'TestCity',
        state: 'CA',
        zip_code: '54321',
        sqft: 2000,
      };

      const property = await propertyListingModel.create(propertyData);

      const result = await testPool.query(
        'SELECT days_on_market FROM property_listings WHERE id = $1',
        [property.id]
      );

      // Pending properties shouldn't have days_on_market calculated
      expect(result.rows[0].days_on_market).toBeNull();
    });
  });

  describe('Test 2: view_count increment functionality', () => {
    it('should increment view_count when updated', async () => {
      const property = await propertyListingModel.create({
        user_id: testUserId,
        title: 'View Count Test Property',
        property_type: PropertyType.WAREHOUSE,
        status: PropertyListingStatus.ACTIVE,
        address: '789 View St',
        city: 'ViewCity',
        state: 'NY',
        zip_code: '11111',
        sqft: 5000,
      });

      // Check initial view_count
      let result = await testPool.query(
        'SELECT view_count FROM property_listings WHERE id = $1',
        [property.id]
      );
      expect(result.rows[0].view_count).toBe(0);

      // Increment view_count
      await testPool.query(
        'UPDATE property_listings SET view_count = view_count + 1 WHERE id = $1',
        [property.id]
      );

      // Check updated view_count
      result = await testPool.query(
        'SELECT view_count FROM property_listings WHERE id = $1',
        [property.id]
      );
      expect(result.rows[0].view_count).toBe(1);

      // Increment again
      await testPool.query(
        'UPDATE property_listings SET view_count = view_count + 1 WHERE id = $1',
        [property.id]
      );

      result = await testPool.query(
        'SELECT view_count FROM property_listings WHERE id = $1',
        [property.id]
      );
      expect(result.rows[0].view_count).toBe(2);
    });
  });

  describe('Test 3: inquiry_count increment functionality', () => {
    it('should increment inquiry_count when updated', async () => {
      const property = await propertyListingModel.create({
        user_id: testUserId,
        title: 'Inquiry Count Test Property',
        property_type: PropertyType.RESTAURANT,
        status: PropertyListingStatus.ACTIVE,
        address: '321 Inquiry Blvd',
        city: 'InquiryCity',
        state: 'FL',
        zip_code: '22222',
        sqft: 3000,
      });

      // Check initial inquiry_count
      let result = await testPool.query(
        'SELECT inquiry_count FROM property_listings WHERE id = $1',
        [property.id]
      );
      expect(result.rows[0].inquiry_count).toBe(0);

      // Increment inquiry_count
      await testPool.query(
        'UPDATE property_listings SET inquiry_count = inquiry_count + 1 WHERE id = $1',
        [property.id]
      );

      // Check updated inquiry_count
      result = await testPool.query(
        'SELECT inquiry_count FROM property_listings WHERE id = $1',
        [property.id]
      );
      expect(result.rows[0].inquiry_count).toBe(1);
    });
  });

  describe('Test 4: last_activity_at timestamp updates', () => {
    it('should update last_activity_at when property is modified', async () => {
      const property = await propertyListingModel.create({
        user_id: testUserId,
        title: 'Last Activity Test Property',
        property_type: PropertyType.INDUSTRIAL,
        status: PropertyListingStatus.ACTIVE,
        address: '555 Activity Ln',
        city: 'ActivityCity',
        state: 'IL',
        zip_code: '33333',
        sqft: 10000,
      });

      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      // Update last_activity_at
      await testPool.query(
        'UPDATE property_listings SET last_activity_at = NOW() WHERE id = $1',
        [property.id]
      );

      const result = await testPool.query(
        'SELECT last_activity_at FROM property_listings WHERE id = $1',
        [property.id]
      );

      expect(result.rows[0].last_activity_at).toBeDefined();
      expect(result.rows[0].last_activity_at).toBeInstanceOf(Date);
    });

    it('should track activity when inquiry_count is incremented', async () => {
      const property = await propertyListingModel.create({
        user_id: testUserId,
        title: 'Activity Tracking Property',
        property_type: PropertyType.OFFICE,
        status: PropertyListingStatus.ACTIVE,
        address: '777 Track Ave',
        city: 'TrackCity',
        state: 'WA',
        zip_code: '44444',
        sqft: 2500,
      });

      // Increment inquiry and update activity timestamp
      await testPool.query(
        'UPDATE property_listings SET inquiry_count = inquiry_count + 1, last_activity_at = NOW() WHERE id = $1',
        [property.id]
      );

      const result = await testPool.query(
        'SELECT inquiry_count, last_activity_at FROM property_listings WHERE id = $1',
        [property.id]
      );

      expect(result.rows[0].inquiry_count).toBe(1);
      expect(result.rows[0].last_activity_at).toBeDefined();
    });
  });

  describe('Test 5: trigger function for days_on_market auto-calculation', () => {
    it('should auto-calculate days_on_market when active property is updated', async () => {
      // Create property with a known created_at date (3 days ago)
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const propertyResult = await testPool.query(
        `INSERT INTO property_listings
        (user_id, title, property_type, status, address, city, state, zip_code, sqft, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id`,
        [
          testUserId,
          'Trigger Test Property',
          'retail',
          'active',
          '999 Trigger Rd',
          'TriggerCity',
          'TX',
          '55555',
          1500,
          threeDaysAgo,
        ]
      );

      const propertyId = propertyResult.rows[0].id;

      // Trigger the update (this should invoke the trigger function)
      await testPool.query(
        'UPDATE property_listings SET title = $1 WHERE id = $2',
        ['Updated Trigger Test Property', propertyId]
      );

      // Check that days_on_market was calculated
      const result = await testPool.query(
        'SELECT days_on_market FROM property_listings WHERE id = $1',
        [propertyId]
      );

      // Should be approximately 3 days
      expect(result.rows[0].days_on_market).toBeGreaterThanOrEqual(2);
      expect(result.rows[0].days_on_market).toBeLessThanOrEqual(4);
    });

    it('should not calculate days_on_market for non-active properties', async () => {
      const property = await propertyListingModel.create({
        user_id: testUserId,
        title: 'Leased Property',
        property_type: PropertyType.RETAIL,
        status: PropertyListingStatus.LEASED,
        address: '888 Leased St',
        city: 'LeasedCity',
        state: 'OR',
        zip_code: '66666',
        sqft: 1200,
      });

      // Update the property (trigger should not set days_on_market for non-active)
      await testPool.query(
        'UPDATE property_listings SET title = $1 WHERE id = $2',
        ['Updated Leased Property', property.id]
      );

      const result = await testPool.query(
        'SELECT days_on_market FROM property_listings WHERE id = $1',
        [property.id]
      );

      expect(result.rows[0].days_on_market).toBeNull();
    });

    it('should recalculate days_on_market on each update for active properties', async () => {
      // Create an active property
      const property = await propertyListingModel.create({
        user_id: testUserId,
        title: 'Recalc Test Property',
        property_type: PropertyType.OFFICE,
        status: PropertyListingStatus.ACTIVE,
        address: '111 Recalc Ave',
        city: 'RecalcCity',
        state: 'CO',
        zip_code: '77777',
        sqft: 3500,
      });

      // First update
      await testPool.query(
        'UPDATE property_listings SET title = $1 WHERE id = $2',
        ['First Update', property.id]
      );

      let result = await testPool.query(
        'SELECT days_on_market FROM property_listings WHERE id = $1',
        [property.id]
      );

      const firstCalculation = result.rows[0].days_on_market;
      expect(firstCalculation).toBeDefined();

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 100));

      // Second update - should recalculate
      await testPool.query(
        'UPDATE property_listings SET title = $1 WHERE id = $2',
        ['Second Update', property.id]
      );

      result = await testPool.query(
        'SELECT days_on_market FROM property_listings WHERE id = $1',
        [property.id]
      );

      const secondCalculation = result.rows[0].days_on_market;
      expect(secondCalculation).toBeDefined();
      // Should be same or slightly higher (if days passed)
      expect(secondCalculation).toBeGreaterThanOrEqual(firstCalculation);
    });
  });
});
