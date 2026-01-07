import { BrokerTenantRequestService } from '../../services/BrokerTenantRequestService';
import { BrokerTenantRequestModel } from '../../database/models/BrokerTenantRequest';
import { TenantPublicProfileModel } from '../../database/models/TenantPublicProfile';

// Mock the models
jest.mock('../../database/models/BrokerTenantRequest');
jest.mock('../../database/models/TenantPublicProfile');

describe('BrokerTenantRequestService', () => {
  let service: BrokerTenantRequestService;
  let mockRequestModel: jest.Mocked<BrokerTenantRequestModel>;
  let mockTenantModel: jest.Mocked<TenantPublicProfileModel>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BrokerTenantRequestService();
    mockRequestModel = (BrokerTenantRequestModel as jest.MockedClass<typeof BrokerTenantRequestModel>).mock.instances[0] as jest.Mocked<BrokerTenantRequestModel>;
    mockTenantModel = (TenantPublicProfileModel as jest.MockedClass<typeof TenantPublicProfileModel>).mock.instances[0] as jest.Mocked<TenantPublicProfileModel>;
  });

  describe('verifyPin', () => {
    it('should validate tenant pin correctly', async () => {
      const tenantId = 'tenant-123';
      const correctPin = '123';

      const tenant = {
        id: tenantId,
        display_name: 'Starbucks Coffee',
        tenant_pin: correctPin,
        rating: 4.8,
        review_count: 245,
        is_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockTenantModel.findById = jest.fn().mockResolvedValue(tenant);

      const validResult = await service.verifyPin(tenantId, correctPin);
      expect(validResult).toBe(true);

      const invalidResult = await service.verifyPin(tenantId, '999');
      expect(invalidResult).toBe(false);
    });

    it('should return false if tenant not found', async () => {
      mockTenantModel.findById = jest.fn().mockResolvedValue(null);

      const result = await service.verifyPin('nonexistent', '123');
      expect(result).toBe(false);
    });
  });
});
