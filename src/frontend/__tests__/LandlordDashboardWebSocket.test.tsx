import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { PropertyListingStatus, PropertyType } from '../../types';

/**
 * Integration tests for LandlordDashboard WebSocket integration
 * Task Group 7.1: Testing WebSocket event handling in the dashboard
 *
 * These tests verify that the dashboard properly handles real-time WebSocket events
 */

// Mock the auth context
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { userId: 'test-user-123', email: 'test@example.com', role: 'LANDLORD' },
    isAuthenticated: true,
  }),
}));

// Mock the API client
jest.mock('../utils/apiClient', () => ({
  getMyPropertyListings: jest.fn(),
  getLandlordKPIs: jest.fn(),
  getPropertyDashboardStats: jest.fn(),
  deletePropertyListing: jest.fn(),
  updatePropertyListingStatus: jest.fn(),
  createPropertyListing: jest.fn(),
  updatePropertyListing: jest.fn(),
}));

// Mock the property dashboard WebSocket hook
jest.mock('../hooks/usePropertyDashboardWebSocket');

// Mock the property filter hook
jest.mock('../hooks/usePropertyFilter', () => ({
  usePropertyFilter: (properties: any[]) => ({
    filteredProperties: properties,
    searchQuery: '',
    setSearchQuery: jest.fn(),
    statusFilter: '',
    setStatusFilter: jest.fn(),
    typeFilter: '',
    setTypeFilter: jest.fn(),
    clearFilters: jest.fn(),
    hasActiveFilters: false,
  }),
}));

// Mock other hooks
jest.mock('../hooks/useInfiniteScroll', () => ({
  useInfiniteScroll: () => ({
    sentinelRef: { current: null },
  }),
}));

// Mock TopNavigation component
jest.mock('../components/TopNavigation', () => ({
  TopNavigation: () => <div>TopNavigation</div>,
}));

// Mock PropertyListingsSection component
jest.mock('../components/PropertyListingsSection', () => ({
  PropertyListingsSection: ({ properties }: any) => (
    <div data-testid="property-listings">
      {properties.map((p: any) => (
        <div key={p.id} data-testid={`property-${p.id}`}>
          {p.title}
        </div>
      ))}
    </div>
  ),
}));

// Mock PropertyListingModal component
jest.mock('../components/PropertyListingModal', () => ({
  PropertyListingModal: () => <div>Modal</div>,
}));

// Mock KPICard component
jest.mock('../components/KPICard', () => ({
  KPICard: ({ title, value }: any) => (
    <div data-testid={`kpi-${title}`}>
      {title}: {value}
    </div>
  ),
}));

// Mock ConnectionIndicator component
jest.mock('../components/ConnectionIndicator', () => ({
  ConnectionIndicator: ({ connectionStatus }: any) => (
    <div data-testid="connection-indicator">{connectionStatus}</div>
  ),
}));

// Import after mocks
import LandlordDashboard from '../pages/LandlordDashboard';
import { usePropertyDashboardWebSocket } from '../hooks/usePropertyDashboardWebSocket';
import { getMyPropertyListings, getLandlordKPIs } from '../utils/apiClient';

describe('LandlordDashboard WebSocket Integration', () => {
  const mockKPIData = {
    totalListings: { value: 10, trend: { value: 2, direction: 'up' as const, period: 'vs last week' } },
    activeListings: { value: 8, trend: { value: 1, direction: 'up' as const, period: 'vs last week' } },
    avgDaysOnMarket: { value: 25, trend: { value: 3, direction: 'down' as const, period: 'vs last week' } },
    responseRate: { value: 15, trend: { value: 5, direction: 'up' as const, period: 'vs last week' } },
  };

  const mockProperties = [
    {
      id: 'property-1',
      user_id: 'test-user-123',
      title: 'Office Space 1',
      status: PropertyListingStatus.ACTIVE,
      property_type: PropertyType.OFFICE,
      address: '123 Main St',
      city: 'Seattle',
      state: 'WA',
      zip_code: '98101',
      sqft: 2000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'property-2',
      user_id: 'test-user-123',
      title: 'Office Space 2',
      status: PropertyListingStatus.ACTIVE,
      property_type: PropertyType.OFFICE,
      address: '456 Oak Ave',
      city: 'Seattle',
      state: 'WA',
      zip_code: '98102',
      sqft: 1500,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  let eventHandlers: any = {};

  beforeEach(() => {
    // Reset event handlers
    eventHandlers = {};

    // Mock API calls
    (getMyPropertyListings as jest.Mock).mockResolvedValue({
      listings: mockProperties,
      total: 2,
      hasMore: false,
    });

    (getLandlordKPIs as jest.Mock).mockResolvedValue(mockKPIData);

    // Mock WebSocket hook to capture event handlers
    (usePropertyDashboardWebSocket as jest.Mock).mockImplementation(
      (userId: string, enabled: boolean, events: any) => {
        eventHandlers = events;
        return {
          connectionStatus: 'connected',
          isConnected: true,
          isPolling: false,
          isReconnecting: false,
          refresh: jest.fn(),
        };
      }
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test 1: KPI updates on kpi-update event
   */
  it('should update KPIs when kpi:update event is received', async () => {
    // Arrange
    render(
      <BrowserRouter>
        <LandlordDashboard />
      </BrowserRouter>
    );

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByTestId('kpi-Total Listings')).toBeInTheDocument();
    });

    // Act - Simulate KPI update event
    const updatedKPIs = {
      totalListings: { value: 12, trend: { value: 4, direction: 'up' as const, period: 'vs last week' } },
      activeListings: { value: 10, trend: { value: 2, direction: 'up' as const, period: 'vs last week' } },
      avgDaysOnMarket: { value: 20, trend: { value: 5, direction: 'down' as const, period: 'vs last week' } },
      responseRate: { value: 20, trend: { value: 10, direction: 'up' as const, period: 'vs last week' } },
    };

    eventHandlers.onKPIUpdate(updatedKPIs);

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('kpi-Total Listings')).toHaveTextContent('12');
    });
  });

  /**
   * Test 2: Property list refresh on property-created event
   */
  it('should refresh property list when property:created event is received', async () => {
    // Arrange
    render(
      <BrowserRouter>
        <LandlordDashboard />
      </BrowserRouter>
    );

    // Wait for initial properties to load
    await waitFor(() => {
      expect(screen.getByTestId('property-property-1')).toBeInTheDocument();
    });

    // Act - Simulate property created event
    const newProperty = {
      id: 'property-3',
      user_id: 'test-user-123',
      title: 'New Office Space',
      status: PropertyListingStatus.PENDING,
      property_type: PropertyType.OFFICE,
      address: '789 Pine St',
      city: 'Seattle',
      state: 'WA',
      zip_code: '98103',
      sqft: 3000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    eventHandlers.onPropertyCreated(newProperty);

    // Assert - Verify the new property appears in the list
    await waitFor(() => {
      expect(screen.getByTestId('property-property-3')).toBeInTheDocument();
    });
  });

  /**
   * Test 3: Property list update on property-updated event
   */
  it('should update property in list when property:updated event is received', async () => {
    // Arrange
    render(
      <BrowserRouter>
        <LandlordDashboard />
      </BrowserRouter>
    );

    // Wait for initial properties to load
    await waitFor(() => {
      expect(screen.getByTestId('property-property-1')).toHaveTextContent('Office Space 1');
    });

    // Act - Simulate property updated event
    const updatedProperty = {
      ...mockProperties[0],
      title: 'Updated Office Space 1',
    };

    eventHandlers.onPropertyUpdated('property-1', updatedProperty);

    // Assert - Verify the property title is updated
    await waitFor(() => {
      expect(screen.getByTestId('property-property-1')).toHaveTextContent('Updated Office Space 1');
    });
  });

  /**
   * Test 4: Property removal on property-deleted event
   */
  it('should remove property from list when property:deleted event is received', async () => {
    // Arrange
    render(
      <BrowserRouter>
        <LandlordDashboard />
      </BrowserRouter>
    );

    // Wait for initial properties to load
    await waitFor(() => {
      expect(screen.getByTestId('property-property-1')).toBeInTheDocument();
    });

    // Act - Simulate property deleted event
    eventHandlers.onPropertyDeleted('property-1');

    // Assert - Verify the property is removed from the list
    await waitFor(() => {
      expect(screen.queryByTestId('property-property-1')).not.toBeInTheDocument();
    });
  });

  /**
   * Test 5: ConnectionIndicator displays correct status
   */
  it('should display correct connection status in ConnectionIndicator', async () => {
    // Arrange - Mock connected status
    (usePropertyDashboardWebSocket as jest.Mock).mockReturnValue({
      connectionStatus: 'connected',
      isConnected: true,
      isPolling: false,
      isReconnecting: false,
      refresh: jest.fn(),
    });

    // Act
    render(
      <BrowserRouter>
        <LandlordDashboard />
      </BrowserRouter>
    );

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('connection-indicator')).toHaveTextContent('connected');
    });
  });
});
