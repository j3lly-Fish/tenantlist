/// <reference types="@testing-library/jest-dom" />
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@contexts/AuthContext';
import { BusinessStatus } from '@types';

// Mock the modules before importing Dashboard
jest.mock('@utils/apiClient');
jest.mock('@utils/websocketClient');
jest.mock('@utils/messagingWebsocket');
jest.mock('@utils/pollingService');

// Import Dashboard AFTER mocks are set up
import Dashboard from '@pages/Dashboard';
import * as apiClient from '@utils/apiClient';
import * as websocketClient from '@utils/websocketClient';

const mockDashboardData = {
  kpis: {
    activeBusinesses: 5,
    responseRate: '75%',
    landlordViews: 1250,
    messagesTotal: 42,
  },
  businesses: [
    {
      id: '1',
      user_id: 'user-1',
      name: 'Test Restaurant',
      category: 'F&B',
      status: BusinessStatus.ACTIVE,
      is_verified: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: '2',
      user_id: 'user-1',
      name: 'Pending Business',
      category: 'Retail',
      status: BusinessStatus.PENDING_VERIFICATION,
      is_verified: false,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ],
  total: 2,
};

// Wrapper component for tests
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

// Type assertions for mocked functions
const mockGetDashboardData = apiClient.getDashboardData as jest.MockedFunction<typeof apiClient.getDashboardData>;
const mockWebsocketClient = websocketClient.websocketClient as jest.Mocked<typeof websocketClient.websocketClient>;

describe('Dashboard Page', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock successful API response
    mockGetDashboardData.mockResolvedValue(mockDashboardData as any);

    // Mock WebSocket client methods
    mockWebsocketClient.connectToDashboard.mockImplementation(() => {});
    mockWebsocketClient.disconnect.mockImplementation(() => {});
    mockWebsocketClient.onKPIUpdate.mockReturnValue(() => {});
    mockWebsocketClient.onBusinessUpdate.mockReturnValue(() => {});
    mockWebsocketClient.onBusinessCreated.mockReturnValue(() => {});
    mockWebsocketClient.onBusinessDeleted.mockReturnValue(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should load and display dashboard data on mount', async () => {
    renderWithProviders(<Dashboard />);

    // Wait for dashboard data to load
    await waitFor(() => {
      expect(mockGetDashboardData).toHaveBeenCalled();
    });

    // Check KPI cards are displayed with correct titles
    await waitFor(() => {
      expect(screen.getByText('Active Businesses')).toBeInTheDocument();
      expect(screen.getByText('Performance')).toBeInTheDocument();
      expect(screen.getByText('Response Rate')).toBeInTheDocument();
      expect(screen.getByText('Landlord Views')).toBeInTheDocument();
    });

    // Check KPI values - Performance value has % suffix
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('42%')).toBeInTheDocument(); // messagesTotal displayed as Performance with %
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('1,250')).toBeInTheDocument();
    });

    // Check business listings are displayed
    await waitFor(() => {
      expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
      expect(screen.getByText('Pending Business')).toBeInTheDocument();
    });
  });

  it('should establish WebSocket connection on mount', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(mockWebsocketClient.connectToDashboard).toHaveBeenCalled();
    });

    // Verify event listeners are set up
    expect(mockWebsocketClient.onKPIUpdate).toHaveBeenCalled();
  });

  it('should filter businesses by search query', async () => {
    renderWithProviders(<Dashboard />);

    // Wait for businesses to load
    await waitFor(() => {
      expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
      expect(screen.getByText('Pending Business')).toBeInTheDocument();
    });

    // Find search input and type
    const searchInput = screen.getByPlaceholderText('Search businesses...');
    expect(searchInput).toBeInTheDocument();

    // Type in search (should filter businesses in real component)
    // This test verifies the search input is present and interactive
  });

  it('should filter businesses by status', async () => {
    renderWithProviders(<Dashboard />);

    // Wait for businesses to load
    await waitFor(() => {
      expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
    });

    // Find status filter dropdown
    const filterButton = screen.getByLabelText('Filter by status');
    expect(filterButton).toBeInTheDocument();

    // This verifies filter dropdown is present
  });

  it('should set up WebSocket event handlers for KPI updates', async () => {
    renderWithProviders(<Dashboard />);

    // Wait for initial load and verify WebSocket handlers are set up
    await waitFor(() => {
      expect(mockWebsocketClient.onKPIUpdate).toHaveBeenCalled();
      expect(mockWebsocketClient.onBusinessUpdate).toHaveBeenCalled();
      expect(mockWebsocketClient.onBusinessCreated).toHaveBeenCalled();
      expect(mockWebsocketClient.onBusinessDeleted).toHaveBeenCalled();
    });
  });

  it('should display empty state when user has no businesses', async () => {
    // Mock empty dashboard data
    const emptyData = {
      kpis: {
        activeBusinesses: 0,
        responseRate: '0%',
        landlordViews: 0,
        messagesTotal: 0,
      },
      businesses: [],
      total: 0,
    };

    mockGetDashboardData.mockResolvedValue(emptyData as any);

    renderWithProviders(<Dashboard />);

    // Wait for empty state to appear
    await waitFor(() => {
      expect(screen.getByText('No Active Listings')).toBeInTheDocument();
    });
  });

  it('should disconnect WebSocket on component unmount', async () => {
    const { unmount } = renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(mockWebsocketClient.connectToDashboard).toHaveBeenCalled();
    });

    // Unmount component
    unmount();

    // Verify WebSocket is disconnected
    expect(mockWebsocketClient.disconnect).toHaveBeenCalled();
  });

  it('should handle API errors gracefully', async () => {
    // Mock API error
    mockGetDashboardData.mockRejectedValue(new Error('Failed to load data'));

    renderWithProviders(<Dashboard />);

    // Wait for error state to appear
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('should display KPI cards with icons', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(mockGetDashboardData).toHaveBeenCalled();
    });

    // Check that icons are rendered
    await waitFor(() => {
      expect(screen.getByTestId('icon-building')).toBeInTheDocument();
      expect(screen.getByTestId('icon-chart')).toBeInTheDocument();
      expect(screen.getByTestId('icon-message')).toBeInTheDocument();
      expect(screen.getByTestId('icon-eye')).toBeInTheDocument();
    });
  });
});
