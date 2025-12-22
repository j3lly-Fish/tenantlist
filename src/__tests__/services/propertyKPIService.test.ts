// Mock uuid before importing other modules
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-value'),
}));

// Mock ioredis with proper state tracking
const mockRedisStorage = new Map();

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    setex: jest.fn((key, ttl, value) => {
      mockRedisStorage.set(key, value);
      return Promise.resolve('OK');
    }),
    get: jest.fn((key) => {
      const value = mockRedisStorage.get(key);
      return Promise.resolve(value || null);
    }),
    del: jest.fn((key) => {
      mockRedisStorage.delete(key);
      return Promise.resolve(1);
    }),
    keys: jest.fn(() => Promise.resolve(Array.from(mockRedisStorage.keys()))),
    quit: jest.fn(() => Promise.resolve('OK')),
    on: jest.fn(),
  }));
});

// Mock pg Pool
const mockQuery = jest.fn();
jest.mock('pg', () => {
  const mClient = {
    query: mockQuery,
    release: jest.fn(),
  };
  const mPool = {
    connect: jest.fn(() => mClient),
    query: mockQuery,
    end: jest.fn(),
    on: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

import { PropertyKPIService } from '../../services/PropertyKPIService';

describe('PropertyKPIService', () => {
  let service: PropertyKPIService;

  beforeEach(() => {
    // Clear Redis mock storage before each test
    mockRedisStorage.clear();
    mockQuery.mockClear();
    service = new PropertyKPIService();
  });

  describe('calculateKPIs', () => {
    it('should calculate totalListings KPI correctly', async () => {
      const userId = 'user-123';

      // Mock database responses for current period
      mockQuery
        // Total listings count
        .mockResolvedValueOnce({ rows: [{ count: '15' }] })
        // Active listings count
        .mockResolvedValueOnce({ rows: [{ count: '12' }] })
        // Avg days on market
        .mockResolvedValueOnce({ rows: [{ avg: '28.5' }] })
        // Response rate calculation
        .mockResolvedValueOnce({
          rows: [{ total_views: '500', total_inquiries: '75' }]
        })
        // Historical total listings (7 days ago)
        .mockResolvedValueOnce({ rows: [{ count: '10' }] })
        // Historical active listings
        .mockResolvedValueOnce({ rows: [{ count: '8' }] })
        // Historical avg days on market
        .mockResolvedValueOnce({ rows: [{ avg: '35' }] })
        // Historical response rate
        .mockResolvedValueOnce({
          rows: [{ total_views: '400', total_inquiries: '60' }]
        });

      const kpis = await service.calculateKPIs(userId);

      expect(kpis.totalListings).toBeDefined();
      expect(kpis.totalListings.value).toBe(15);
      expect(kpis.totalListings.trend).toBeDefined();
      expect(kpis.totalListings.trend.direction).toBe('up');
      expect(kpis.totalListings.trend.period).toBe('vs last week');
    });

    it('should calculate activeListings KPI correctly', async () => {
      const userId = 'user-456';

      // Mock database responses
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '8' }] }) // total
        .mockResolvedValueOnce({ rows: [{ count: '6' }] }) // active
        .mockResolvedValueOnce({ rows: [{ avg: '20' }] }) // avg days
        .mockResolvedValueOnce({
          rows: [{ total_views: '300', total_inquiries: '45' }]
        })
        .mockResolvedValueOnce({ rows: [{ count: '10' }] }) // historical total
        .mockResolvedValueOnce({ rows: [{ count: '5' }] }) // historical active
        .mockResolvedValueOnce({ rows: [{ avg: '22' }] })
        .mockResolvedValueOnce({
          rows: [{ total_views: '250', total_inquiries: '30' }]
        });

      const kpis = await service.calculateKPIs(userId);

      expect(kpis.activeListings).toBeDefined();
      expect(kpis.activeListings.value).toBe(6);
      expect(kpis.activeListings.trend).toBeDefined();
      expect(kpis.activeListings.trend.direction).toBe('up');
    });

    it('should calculate avgDaysOnMarket with trend correctly', async () => {
      const userId = 'user-789';

      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })
        .mockResolvedValueOnce({ rows: [{ avg: '25' }] }) // current: 25 days
        .mockResolvedValueOnce({
          rows: [{ total_views: '200', total_inquiries: '30' }]
        })
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })
        .mockResolvedValueOnce({ rows: [{ avg: '35' }] }) // historical: 35 days
        .mockResolvedValueOnce({
          rows: [{ total_views: '180', total_inquiries: '25' }]
        });

      const kpis = await service.calculateKPIs(userId);

      expect(kpis.avgDaysOnMarket).toBeDefined();
      expect(kpis.avgDaysOnMarket.value).toBe(25);
      expect(kpis.avgDaysOnMarket.trend).toBeDefined();
      // Down is good for days on market
      expect(kpis.avgDaysOnMarket.trend.direction).toBe('down');
      expect(Math.abs(kpis.avgDaysOnMarket.trend.value)).toBeGreaterThan(0);
    });

    it('should calculate responseRate with trend correctly', async () => {
      const userId = 'user-101';

      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '10' }] })
        .mockResolvedValueOnce({ rows: [{ count: '8' }] })
        .mockResolvedValueOnce({ rows: [{ avg: '30' }] })
        .mockResolvedValueOnce({
          rows: [{ total_views: '1000', total_inquiries: '150' }] // 15% response rate
        })
        .mockResolvedValueOnce({ rows: [{ count: '10' }] })
        .mockResolvedValueOnce({ rows: [{ count: '8' }] })
        .mockResolvedValueOnce({ rows: [{ avg: '30' }] })
        .mockResolvedValueOnce({
          rows: [{ total_views: '800', total_inquiries: '100' }] // 12.5% historical
        });

      const kpis = await service.calculateKPIs(userId);

      expect(kpis.responseRate).toBeDefined();
      expect(kpis.responseRate.value).toBe(15); // 150/1000 * 100
      expect(kpis.responseRate.trend).toBeDefined();
      expect(kpis.responseRate.trend.direction).toBe('up');
    });
  });

  describe('Redis caching', () => {
    it('should cache KPIs and return cached data on subsequent calls', async () => {
      const userId = 'user-cache-123';

      // Mock first calculation
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '10' }] })
        .mockResolvedValueOnce({ rows: [{ count: '8' }] })
        .mockResolvedValueOnce({ rows: [{ avg: '25' }] })
        .mockResolvedValueOnce({
          rows: [{ total_views: '500', total_inquiries: '75' }]
        })
        .mockResolvedValueOnce({ rows: [{ count: '8' }] })
        .mockResolvedValueOnce({ rows: [{ count: '6' }] })
        .mockResolvedValueOnce({ rows: [{ avg: '30' }] })
        .mockResolvedValueOnce({
          rows: [{ total_views: '400', total_inquiries: '60' }]
        });

      // First call - should calculate and cache
      const kpis1 = await service.calculateKPIs(userId);
      await service.cacheKPIs(userId, kpis1);

      // Second call - should return from cache
      const cachedKpis = await service.getCachedKPIs(userId);

      expect(cachedKpis).toBeDefined();
      expect(cachedKpis?.totalListings.value).toBe(kpis1.totalListings.value);
      expect(cachedKpis?.activeListings.value).toBe(kpis1.activeListings.value);
    });

    it('should return null for cache miss', async () => {
      const userId = 'user-no-cache';

      const cachedKpis = await service.getCachedKPIs(userId);

      expect(cachedKpis).toBeNull();
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate cache for a user', async () => {
      const userId = 'user-invalidate-123';

      // Mock and cache some KPIs
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })
        .mockResolvedValueOnce({ rows: [{ count: '4' }] })
        .mockResolvedValueOnce({ rows: [{ avg: '20' }] })
        .mockResolvedValueOnce({
          rows: [{ total_views: '200', total_inquiries: '30' }]
        })
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })
        .mockResolvedValueOnce({ rows: [{ count: '4' }] })
        .mockResolvedValueOnce({ rows: [{ avg: '20' }] })
        .mockResolvedValueOnce({
          rows: [{ total_views: '180', total_inquiries: '25' }]
        });

      const kpis = await service.calculateKPIs(userId);
      await service.cacheKPIs(userId, kpis);

      // Verify cache exists
      let cachedKpis = await service.getCachedKPIs(userId);
      expect(cachedKpis).toBeDefined();

      // Invalidate cache
      await service.invalidateCache(userId);

      // Verify cache is cleared
      cachedKpis = await service.getCachedKPIs(userId);
      expect(cachedKpis).toBeNull();
    });
  });
});
