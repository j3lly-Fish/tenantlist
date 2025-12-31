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

import { BrokerKPIService } from '../../services/BrokerKPIService';

describe('BrokerKPIService', () => {
  let service: BrokerKPIService;

  beforeEach(() => {
    // Clear Redis mock storage before each test
    mockRedisStorage.clear();
    mockQuery.mockClear();
    service = new BrokerKPIService();
  });

  describe('calculateKPIs', () => {
    it('should calculate activeDeals KPI correctly', async () => {
      const userId = 'broker-123';

      // Mock database responses for current period
      mockQuery
        // Active deals count (NOT signed or lost)
        .mockResolvedValueOnce({ rows: [{ count: '8' }] })
        // Commission pipeline sum
        .mockResolvedValueOnce({ rows: [{ total_commission: '45000.00' }] })
        // Response rate calculation (messages sent/replied)
        .mockResolvedValueOnce({
          rows: [{ total_sent: '120', total_replied: '96' }]
        })
        // Properties matched count
        .mockResolvedValueOnce({ rows: [{ count: '15' }] })
        // Historical active deals (7 days ago)
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })
        // Historical commission pipeline
        .mockResolvedValueOnce({ rows: [{ total_commission: '30000.00' }] })
        // Historical response rate
        .mockResolvedValueOnce({
          rows: [{ total_sent: '100', total_replied: '75' }]
        })
        // Historical properties matched
        .mockResolvedValueOnce({ rows: [{ count: '12' }] });

      const kpis = await service.calculateKPIs(userId);

      expect(kpis.activeDeals).toBeDefined();
      expect(kpis.activeDeals.value).toBe(8);
      expect(kpis.activeDeals.trend).toBeDefined();
      expect(kpis.activeDeals.trend.direction).toBe('up');
      expect(kpis.activeDeals.trend.period).toBe('vs last week');
    });

    it('should calculate commissionPipeline KPI correctly', async () => {
      const userId = 'broker-456';

      // Mock database responses
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '12' }] }) // active deals
        .mockResolvedValueOnce({ rows: [{ total_commission: '75000.50' }] }) // commission pipeline
        .mockResolvedValueOnce({
          rows: [{ total_sent: '150', total_replied: '120' }]
        })
        .mockResolvedValueOnce({ rows: [{ count: '20' }] }) // properties matched
        .mockResolvedValueOnce({ rows: [{ count: '10' }] }) // historical active deals
        .mockResolvedValueOnce({ rows: [{ total_commission: '60000.00' }] }) // historical pipeline
        .mockResolvedValueOnce({
          rows: [{ total_sent: '130', total_replied: '100' }]
        })
        .mockResolvedValueOnce({ rows: [{ count: '18' }] });

      const kpis = await service.calculateKPIs(userId);

      expect(kpis.commissionPipeline).toBeDefined();
      expect(kpis.commissionPipeline.value).toBe(75000.5);
      expect(kpis.commissionPipeline.trend).toBeDefined();
      expect(kpis.commissionPipeline.trend.direction).toBe('up');
    });

    it('should calculate responseRate with trend correctly', async () => {
      const userId = 'broker-789';

      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '6' }] })
        .mockResolvedValueOnce({ rows: [{ total_commission: '40000.00' }] })
        .mockResolvedValueOnce({
          rows: [{ total_sent: '200', total_replied: '160' }] // 80% response rate
        })
        .mockResolvedValueOnce({ rows: [{ count: '25' }] })
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })
        .mockResolvedValueOnce({ rows: [{ total_commission: '35000.00' }] })
        .mockResolvedValueOnce({
          rows: [{ total_sent: '180', total_replied: '126' }] // 70% historical
        })
        .mockResolvedValueOnce({ rows: [{ count: '22' }] });

      const kpis = await service.calculateKPIs(userId);

      expect(kpis.responseRate).toBeDefined();
      expect(kpis.responseRate.value).toBe(80); // 160/200 * 100
      expect(kpis.responseRate.trend).toBeDefined();
      expect(kpis.responseRate.trend.direction).toBe('up');
    });

    it('should calculate propertiesMatched with trend correctly', async () => {
      const userId = 'broker-101';

      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '10' }] })
        .mockResolvedValueOnce({ rows: [{ total_commission: '50000.00' }] })
        .mockResolvedValueOnce({
          rows: [{ total_sent: '100', total_replied: '80' }]
        })
        .mockResolvedValueOnce({ rows: [{ count: '30' }] }) // current: 30 matches
        .mockResolvedValueOnce({ rows: [{ count: '8' }] })
        .mockResolvedValueOnce({ rows: [{ total_commission: '45000.00' }] })
        .mockResolvedValueOnce({
          rows: [{ total_sent: '90', total_replied: '70' }]
        })
        .mockResolvedValueOnce({ rows: [{ count: '25' }] }); // historical: 25 matches

      const kpis = await service.calculateKPIs(userId);

      expect(kpis.propertiesMatched).toBeDefined();
      expect(kpis.propertiesMatched.value).toBe(30);
      expect(kpis.propertiesMatched.trend).toBeDefined();
      expect(kpis.propertiesMatched.trend.direction).toBe('up');
      expect(kpis.propertiesMatched.trend.value).toBeGreaterThan(0);
    });

    it('should handle zero commission pipeline gracefully', async () => {
      const userId = 'broker-zero';

      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '3' }] })
        .mockResolvedValueOnce({ rows: [{ total_commission: null }] }) // No commission data
        .mockResolvedValueOnce({
          rows: [{ total_sent: '50', total_replied: '40' }]
        })
        .mockResolvedValueOnce({ rows: [{ count: '10' }] })
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })
        .mockResolvedValueOnce({ rows: [{ total_commission: null }] })
        .mockResolvedValueOnce({
          rows: [{ total_sent: '45', total_replied: '35' }]
        })
        .mockResolvedValueOnce({ rows: [{ count: '8' }] });

      const kpis = await service.calculateKPIs(userId);

      expect(kpis.commissionPipeline).toBeDefined();
      expect(kpis.commissionPipeline.value).toBe(0);
      expect(kpis.commissionPipeline.trend).toBeDefined();
    });
  });

  describe('Redis caching', () => {
    it('should cache KPIs and return cached data on subsequent calls', async () => {
      const userId = 'broker-cache-123';

      // Mock first calculation
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '7' }] })
        .mockResolvedValueOnce({ rows: [{ total_commission: '55000.00' }] })
        .mockResolvedValueOnce({
          rows: [{ total_sent: '110', total_replied: '88' }]
        })
        .mockResolvedValueOnce({ rows: [{ count: '18' }] })
        .mockResolvedValueOnce({ rows: [{ count: '6' }] })
        .mockResolvedValueOnce({ rows: [{ total_commission: '50000.00' }] })
        .mockResolvedValueOnce({
          rows: [{ total_sent: '100', total_replied: '80' }]
        })
        .mockResolvedValueOnce({ rows: [{ count: '15' }] });

      // First call - should calculate and cache
      const kpis1 = await service.calculateKPIs(userId);
      await service.cacheKPIs(userId, kpis1);

      // Second call - should return from cache
      const cachedKpis = await service.getCachedKPIs(userId);

      expect(cachedKpis).toBeDefined();
      expect(cachedKpis?.activeDeals.value).toBe(kpis1.activeDeals.value);
      expect(cachedKpis?.commissionPipeline.value).toBe(kpis1.commissionPipeline.value);
      expect(cachedKpis?.responseRate.value).toBe(kpis1.responseRate.value);
      expect(cachedKpis?.propertiesMatched.value).toBe(kpis1.propertiesMatched.value);
    });

    it('should return null for cache miss', async () => {
      const userId = 'broker-no-cache';

      const cachedKpis = await service.getCachedKPIs(userId);

      expect(cachedKpis).toBeNull();
    });

    it('should use correct cache key pattern', async () => {
      const userId = 'broker-key-test';

      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })
        .mockResolvedValueOnce({ rows: [{ total_commission: '30000.00' }] })
        .mockResolvedValueOnce({
          rows: [{ total_sent: '80', total_replied: '64' }]
        })
        .mockResolvedValueOnce({ rows: [{ count: '12' }] })
        .mockResolvedValueOnce({ rows: [{ count: '4' }] })
        .mockResolvedValueOnce({ rows: [{ total_commission: '25000.00' }] })
        .mockResolvedValueOnce({
          rows: [{ total_sent: '70', total_replied: '56' }]
        })
        .mockResolvedValueOnce({ rows: [{ count: '10' }] });

      const kpis = await service.calculateKPIs(userId);
      await service.cacheKPIs(userId, kpis);

      // Check cache key exists
      const cacheKey = `broker-kpis:${userId}`;
      expect(mockRedisStorage.has(cacheKey)).toBe(true);
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate cache for a broker', async () => {
      const userId = 'broker-invalidate-123';

      // Mock and cache some KPIs
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '4' }] })
        .mockResolvedValueOnce({ rows: [{ total_commission: '20000.00' }] })
        .mockResolvedValueOnce({
          rows: [{ total_sent: '60', total_replied: '48' }]
        })
        .mockResolvedValueOnce({ rows: [{ count: '10' }] })
        .mockResolvedValueOnce({ rows: [{ count: '3' }] })
        .mockResolvedValueOnce({ rows: [{ total_commission: '18000.00' }] })
        .mockResolvedValueOnce({
          rows: [{ total_sent: '55', total_replied: '44' }]
        })
        .mockResolvedValueOnce({ rows: [{ count: '9' }] });

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

  describe('getKPIs with automatic caching', () => {
    it('should calculate and cache on first call, return cached on second call', async () => {
      const userId = 'broker-auto-cache';

      // Mock for first calculation
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '9' }] })
        .mockResolvedValueOnce({ rows: [{ total_commission: '65000.00' }] })
        .mockResolvedValueOnce({
          rows: [{ total_sent: '140', total_replied: '112' }]
        })
        .mockResolvedValueOnce({ rows: [{ count: '22' }] })
        .mockResolvedValueOnce({ rows: [{ count: '7' }] })
        .mockResolvedValueOnce({ rows: [{ total_commission: '55000.00' }] })
        .mockResolvedValueOnce({
          rows: [{ total_sent: '120', total_replied: '96' }]
        })
        .mockResolvedValueOnce({ rows: [{ count: '20' }] });

      // First call - should calculate and cache
      const kpis1 = await service.getKPIs(userId);
      expect(kpis1.activeDeals.value).toBe(9);

      // Clear mock to ensure no new queries
      mockQuery.mockClear();

      // Second call - should return from cache without hitting DB
      const kpis2 = await service.getKPIs(userId);
      expect(kpis2.activeDeals.value).toBe(9);
      expect(mockQuery).not.toHaveBeenCalled(); // No DB queries on cached call
    });
  });
});
