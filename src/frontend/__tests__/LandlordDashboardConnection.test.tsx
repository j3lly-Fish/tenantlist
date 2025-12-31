import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import LandlordDashboard from '../pages/LandlordDashboard';
import * as AuthContext from '../contexts/AuthContext';
import * as useDashboardWebSocketModule from '../hooks/useDashboardWebSocket';

// Mock dependencies
jest.mock('../contexts/AuthContext');
jest.mock('../hooks/useDashboardWebSocket');
jest.mock('../hooks/usePropertyFilter');
jest.mock('../hooks/useInfiniteScroll');
jest.mock('../utils/apiClient', () => ({
  getMyPropertyListings: jest.fn().mockResolvedValue({
    listings: [],
    total: 0,
    hasMore: false,
  }),
  getPropertyDashboardStats: jest.fn().mockResolvedValue({
    total: 0,
    active: 0,
    pending: 0,
    leased: 0,
    offMarket: 0,
    totalViews: 0,
    totalInquiries: 0,
  }),
  getLandlordKPIs: jest.fn().mockResolvedValue({}),
  deletePropertyListing: jest.fn().mockResolvedValue({}),
  updatePropertyListingStatus: jest.fn().mockResolvedValue({ listing: {} }),
}));

const mockUseAuth = AuthContext.useAuth as jest.MockedFunction<typeof AuthContext.useAuth>;
const mockUseDashboardWebSocket = useDashboardWebSocketModule.useDashboardWebSocket as jest.MockedFunction<
  typeof useDashboardWebSocketModule.useDashboardWebSocket
>;

// Mock usePropertyFilter
const mockUsePropertyFilter = require('../hooks/usePropertyFilter').usePropertyFilter as jest.Mock;
mockUsePropertyFilter.mockReturnValue({
  filteredProperties: [],
  searchQuery: '',
  setSearchQuery: jest.fn(),
  statusFilter: 'all',
  setStatusFilter: jest.fn(),
  typeFilter: 'all',
  setTypeFilter: jest.fn(),
  clearFilters: jest.fn(),
  hasActiveFilters: false,
});

// Mock useInfiniteScroll
const mockUseInfiniteScroll = require('../hooks/useInfiniteScroll').useInfiniteScroll as jest.Mock;
mockUseInfiniteScroll.mockReturnValue({
  sentinelRef: { current: null },
});

describe('LandlordDashboard ConnectionIndicator Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock auth context
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@test.com', role: 'landlord' },
      login: jest.fn(),
      logout: jest.fn(),
      signup: jest.fn(),
      loading: false,
    } as any);
  });

  it('should render ConnectionIndicator in dashboard header', async () => {
    mockUseDashboardWebSocket.mockReturnValue({
      isConnected: true,
      isFallbackPolling: false,
    });

    render(
      <BrowserRouter>
        <LandlordDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  it('should display "Live" status when WebSocket is connected', async () => {
    mockUseDashboardWebSocket.mockReturnValue({
      isConnected: true,
      isFallbackPolling: false,
    });

    render(
      <BrowserRouter>
        <LandlordDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Live')).toBeInTheDocument();
    });
  });

  it('should display "Polling" status when fallback polling is active', async () => {
    mockUseDashboardWebSocket.mockReturnValue({
      isConnected: false,
      isFallbackPolling: true,
    });

    render(
      <BrowserRouter>
        <LandlordDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Polling')).toBeInTheDocument();
    });
  });

  it('should display "Disconnected" status when not connected and not polling', async () => {
    mockUseDashboardWebSocket.mockReturnValue({
      isConnected: false,
      isFallbackPolling: false,
    });

    render(
      <BrowserRouter>
        <LandlordDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });
  });

  it('should position ConnectionIndicator next to Add Property button', async () => {
    mockUseDashboardWebSocket.mockReturnValue({
      isConnected: true,
      isFallbackPolling: false,
    });

    const { container } = render(
      <BrowserRouter>
        <LandlordDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Find the header actions container
      const headerActions = container.querySelector('.headerActions');
      expect(headerActions).toBeInTheDocument();

      // Check that it contains both the connection indicator and button
      const connectionIndicator = headerActions?.querySelector('[role="status"]');
      const addButton = screen.getByText('+ Add Property');

      expect(connectionIndicator).toBeInTheDocument();
      expect(addButton).toBeInTheDocument();
    });
  });

  it('should call useDashboardWebSocket hook on mount', async () => {
    mockUseDashboardWebSocket.mockReturnValue({
      isConnected: true,
      isFallbackPolling: false,
    });

    render(
      <BrowserRouter>
        <LandlordDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockUseDashboardWebSocket).toHaveBeenCalled();
    });
  });
});
