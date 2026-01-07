import { TenantProfileService } from '../../services/TenantProfileService';
import { TenantPublicProfileModel } from '../../database/models/TenantPublicProfile';

// Mock the model
jest.mock('../../database/models/TenantPublicProfile');

describe('TenantProfileService', () => {
  let service: TenantProfileService;
  let mockModel: jest.Mocked<TenantPublicProfileModel>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TenantProfileService();
    mockModel = (TenantPublicProfileModel as jest.MockedClass<typeof TenantPublicProfileModel>).mock.instances[0] as jest.Mocked<TenantPublicProfileModel>;
  });

  describe('search', () => {
    it('should search tenant profiles with filters and pagination', async () => {
      const filters = {
        search: 'Starbucks',
        category: 'Quick Service Retail',
      };

      const mockProfiles = [
        {
          id: 'tenant-1',
          display_name: 'Starbucks Coffee',
          category: 'Quick Service Retail',
          rating: 4.8,
          is_verified: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockModel.findPaginated = jest.fn().mockResolvedValue({
        profiles: mockProfiles,
        total: 1,
      });

      const result = await service.search({ page: 1, limit: 20, ...filters });

      expect(mockModel.findPaginated).toHaveBeenCalledWith(20, 0, filters);
      expect(result.profiles).toEqual(mockProfiles);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });
});
