import { PropertyListingController } from '../../controllers/PropertyListingController';
import { PropertyListingModel } from '../../database/models/PropertyListing';
import { PropertyListingMetricsModel } from '../../database/models/PropertyListingMetrics';
import { PropertyDashboardEventService } from '../../services/PropertyDashboardEventService';
import { PropertyType, PropertyListingStatus } from '../../types';

/**
 * Integration tests for PropertyListingController event emissions
 * Task Group 5.1: Testing event integration with PropertyDashboardEventService
 *
 * These tests verify that CRUD operations emit the correct WebSocket events
 */

describe('PropertyListingController Event Integration', () => {
  let controller: PropertyListingController;
  let mockPropertyModel: jest.Mocked<PropertyListingModel>;
  let mockMetricsModel: jest.Mocked<PropertyListingMetricsModel>;
  let mockEventService: jest.Mocked<PropertyDashboardEventService>;

  const mockUserId = 'test-user-123';
  const mockPropertyId = 'property-456';

  const mockProperty = {
    id: mockPropertyId,
    user_id: mockUserId,
    title: 'Office Space Downtown',
    description: 'Modern office space',
    property_type: PropertyType.OFFICE,
    status: PropertyListingStatus.ACTIVE,
    address: '123 Main St',
    city: 'Seattle',
    state: 'WA',
    zip_code: '98101',
    sqft: 2000,
    asking_price: 5000,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    // Create mock models
    mockPropertyModel = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockMetricsModel = {} as any;

    // Create mock event service
    mockEventService = {
      onPropertyCreated: jest.fn(),
      onPropertyUpdated: jest.fn(),
      onPropertyDeleted: jest.fn(),
      onStatusChanged: jest.fn(),
    } as any;

    // Create controller with mocks
    controller = new PropertyListingController(mockPropertyModel, mockMetricsModel);
    // Inject event service (we'll add this to the controller)
    (controller as any).eventService = mockEventService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test 1: Property creation emits property-created event
   */
  describe('createListing', () => {
    it('should emit property-created event after successful creation', async () => {
      // Arrange
      mockPropertyModel.create.mockResolvedValue(mockProperty);

      // Act
      await controller.createListing(mockUserId, {
        title: 'Office Space Downtown',
        property_type: PropertyType.OFFICE,
        address: '123 Main St',
        city: 'Seattle',
        state: 'WA',
        zip_code: '98101',
        sqft: 2000,
      });

      // Assert
      expect(mockEventService.onPropertyCreated).toHaveBeenCalledTimes(1);
      expect(mockEventService.onPropertyCreated).toHaveBeenCalledWith(
        mockUserId,
        mockProperty
      );
    });

    it('should not emit event if creation fails', async () => {
      // Arrange
      mockPropertyModel.create.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(
        controller.createListing(mockUserId, {
          title: 'Office Space Downtown',
          property_type: PropertyType.OFFICE,
          address: '123 Main St',
          city: 'Seattle',
          state: 'WA',
          zip_code: '98101',
          sqft: 2000,
        })
      ).rejects.toThrow('Database error');

      expect(mockEventService.onPropertyCreated).not.toHaveBeenCalled();
    });
  });

  /**
   * Test 2: Property update emits property-updated event
   */
  describe('updateListing', () => {
    it('should emit property-updated event after successful update', async () => {
      // Arrange
      mockPropertyModel.findById.mockResolvedValue(mockProperty);
      const updatedProperty = { ...mockProperty, title: 'Updated Title' };
      mockPropertyModel.update.mockResolvedValue(updatedProperty);

      // Act
      await controller.updateListing(mockPropertyId, mockUserId, {
        title: 'Updated Title',
      });

      // Assert
      expect(mockEventService.onPropertyUpdated).toHaveBeenCalledTimes(1);
      expect(mockEventService.onPropertyUpdated).toHaveBeenCalledWith(
        mockUserId,
        mockPropertyId,
        updatedProperty
      );
    });

    it('should not emit event if update fails', async () => {
      // Arrange
      mockPropertyModel.findById.mockResolvedValue(mockProperty);
      mockPropertyModel.update.mockResolvedValue(null);

      // Act & Assert
      await expect(
        controller.updateListing(mockPropertyId, mockUserId, { title: 'Updated' })
      ).rejects.toThrow('Failed to update property listing');

      expect(mockEventService.onPropertyUpdated).not.toHaveBeenCalled();
    });
  });

  /**
   * Test 3: Property deletion emits property-deleted event
   */
  describe('deleteListing', () => {
    it('should emit property-deleted event after successful deletion', async () => {
      // Arrange
      mockPropertyModel.findById.mockResolvedValue(mockProperty);
      mockPropertyModel.delete.mockResolvedValue(true);

      // Act
      await controller.deleteListing(mockPropertyId, mockUserId);

      // Assert
      expect(mockEventService.onPropertyDeleted).toHaveBeenCalledTimes(1);
      expect(mockEventService.onPropertyDeleted).toHaveBeenCalledWith(
        mockUserId,
        mockPropertyId
      );
    });

    it('should not emit event if deletion fails', async () => {
      // Arrange
      mockPropertyModel.findById.mockResolvedValue(mockProperty);
      mockPropertyModel.delete.mockResolvedValue(false);

      // Act & Assert
      await expect(
        controller.deleteListing(mockPropertyId, mockUserId)
      ).rejects.toThrow('Failed to delete property listing');

      expect(mockEventService.onPropertyDeleted).not.toHaveBeenCalled();
    });
  });

  /**
   * Test 4: Status change emits status-changed event
   */
  describe('updateListingStatus', () => {
    it('should emit status-changed event after successful status update', async () => {
      // Arrange
      const oldStatus = PropertyListingStatus.ACTIVE;
      const newStatus = PropertyListingStatus.INACTIVE;
      const propertyWithOldStatus = { ...mockProperty, status: oldStatus };
      const propertyWithNewStatus = { ...mockProperty, status: newStatus };

      mockPropertyModel.findById.mockResolvedValue(propertyWithOldStatus);
      mockPropertyModel.updateStatus.mockResolvedValue(propertyWithNewStatus);

      // Act
      await controller.updateListingStatus(mockPropertyId, mockUserId, newStatus);

      // Assert
      expect(mockEventService.onStatusChanged).toHaveBeenCalledTimes(1);
      expect(mockEventService.onStatusChanged).toHaveBeenCalledWith(
        mockUserId,
        mockPropertyId,
        oldStatus,
        newStatus
      );
    });

    it('should not emit event if status update fails', async () => {
      // Arrange
      mockPropertyModel.findById.mockResolvedValue(mockProperty);
      mockPropertyModel.updateStatus.mockResolvedValue(null);

      // Act & Assert
      await expect(
        controller.updateListingStatus(mockPropertyId, mockUserId, PropertyListingStatus.INACTIVE)
      ).rejects.toThrow('Failed to update listing status');

      expect(mockEventService.onStatusChanged).not.toHaveBeenCalled();
    });
  });
});
