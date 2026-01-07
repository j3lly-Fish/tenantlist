import { BusinessProfileService } from '../../services/BusinessProfileService';
import { BusinessProfileModel } from '../../database/models/BusinessProfile';
import { BusinessTeamMemberModel } from '../../database/models/BusinessTeamMember';
import { BusinessProfileStatsModel } from '../../database/models/BusinessProfileStats';

// Mock the models
jest.mock('../../database/models/BusinessProfile');
jest.mock('../../database/models/BusinessTeamMember');
jest.mock('../../database/models/BusinessProfileStats');

describe('BusinessProfileService', () => {
  let service: BusinessProfileService;
  let mockBusinessProfileModel: jest.Mocked<BusinessProfileModel>;
  let mockTeamMemberModel: jest.Mocked<BusinessTeamMemberModel>;
  let mockStatsModel: jest.Mocked<BusinessProfileStatsModel>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Get mocked constructors
    const MockedBusinessProfileModel = BusinessProfileModel as jest.MockedClass<typeof BusinessProfileModel>;
    const MockedTeamMemberModel = BusinessTeamMemberModel as jest.MockedClass<typeof BusinessTeamMemberModel>;
    const MockedStatsModel = BusinessProfileStatsModel as jest.MockedClass<typeof BusinessProfileStatsModel>;

    // Create service instance (this will instantiate the mocked models)
    service = new BusinessProfileService();

    // Get mocked model instances
    mockBusinessProfileModel = MockedBusinessProfileModel.mock.instances[MockedBusinessProfileModel.mock.instances.length - 1] as jest.Mocked<BusinessProfileModel>;
    mockTeamMemberModel = MockedTeamMemberModel.mock.instances[MockedTeamMemberModel.mock.instances.length - 1] as jest.Mocked<BusinessTeamMemberModel>;
    mockStatsModel = MockedStatsModel.mock.instances[MockedStatsModel.mock.instances.length - 1] as jest.Mocked<BusinessProfileStatsModel>;
  });

  describe('create', () => {
    it('should create business profile and initialize stats', async () => {
      const userId = 'user-123';
      const profileData = {
        company_name: 'CBRE',
        logo_url: 'https://example.com/logo.png',
        established_year: 1996,
        location_city: 'Dallas',
        location_state: 'TX',
      };

      const createdProfile = {
        id: 'profile-123',
        created_by_user_id: userId,
        ...profileData,
        is_verified: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const stats = {
        business_profile_id: 'profile-123',
        offices_count: 0,
        agents_count: 0,
        tenants_count: 0,
        properties_count: 0,
        updated_at: new Date(),
      };

      mockBusinessProfileModel.create = jest.fn().mockResolvedValue(createdProfile);
      mockStatsModel.findByBusinessProfileId = jest.fn().mockResolvedValue(stats);

      const result = await service.create(userId, profileData);

      expect(mockBusinessProfileModel.create).toHaveBeenCalledWith({
        created_by_user_id: userId,
        ...profileData,
      });
      expect(result).toEqual({ ...createdProfile, stats });
    });
  });

  describe('calculateStats', () => {
    it('should aggregate stats from related tables', async () => {
      const profileId = 'profile-123';

      const profile = {
        id: profileId,
        created_by_user_id: 'user-123',
        company_name: 'CBRE',
        is_verified: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const stats = {
        business_profile_id: profileId,
        offices_count: 0,
        agents_count: 5,
        tenants_count: 0,
        properties_count: 0,
        updated_at: new Date(),
      };

      mockBusinessProfileModel.findById = jest.fn().mockResolvedValue(profile);
      mockStatsModel.recalculate = jest.fn().mockResolvedValue(stats);

      const result = await service.calculateStats(profileId);

      expect(mockBusinessProfileModel.findById).toHaveBeenCalledWith(profileId);
      expect(mockStatsModel.recalculate).toHaveBeenCalledWith(profileId);
      expect(result).toEqual(stats);
    });
  });
});
