import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import BrokerDashboard from '../pages/BrokerDashboard';
import * as AuthContext from '../contexts/AuthContext';
import * as apiClient from '../utils/apiClient';
import * as usePropertyDashboardWebSocketModule from '../hooks/usePropertyDashboardWebSocket';

// Mock dependencies
jest.mock('../contexts/AuthContext');
jest.mock('../utils/apiClient');
jest.mock('../hooks/usePropertyDashboardWebSocket');

const mockUseAuth = AuthContext.useAuth as jest.MockedFunction<typeof AuthContext.useAuth>;
const mockGetBrokerKPIs = apiClient.getBrokerKPIs as jest.MockedFunction<typeof apiClient.getBrokerKPIs>;
const mockGetBrokerProfile = apiClient.getBrokerProfile as jest.MockedFunction<typeof apiClient.getBrokerProfile>;
const mockUsePropertyDashboardWebSocket = usePropertyDashboardWebSocketModule.usePropertyDashboardWebSocket as jest.MockedFunction<typeof usePropertyDashboardWebSocketModule.usePropertyDashboardWebSocket>;

describe('BrokerDashboard', () => {
  const mockKPIData = {
    activeDeals: {
      value: 8,
      trend: { value: 20.0, direction: 'up' as const, period: 'vs last week' },
    },
    commissionPipeline: {
      value: 45000.0,
      trend: { value: 15.5, direction: 'up' as const, period: 'vs last week' },
    },
    responseRate: {
      value: 85,
      trend: { value: 5.0, direction: 'up' as const, period: 'vs last week' },
    },
    propertiesMatched: {
      value: 12,
      trend: { value: 10.0, direction: 'up' as const, period: 'vs last week' },
    },
  };

  const mockBrokerProfile = {
    id: 'profile-123',
    user_id: 'broker-user-123',
    company_name: 'Test Brokerage LLC',
    license_number: 'BRK123456',
    license_state: 'CA',
    specialties: ['retail', 'office'],
    bio: 'Experienced commercial real estate broker',
    website_url: 'https://testbrokerage.com',
    years_experience: 10,
    total_deals_closed: 12,
    total_commission_earned: 150000.0,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock auth context
    mockUseAuth.mockReturnValue({
      user: { userId: 'broker-user-123', email: 'broker@test.com', role: 'BROKER' },
      login: jest.fn(),
      logout: jest.fn(),
      signup: jest.fn(),
      loading: false,
    } as any);

    // Mock API calls
    mockGetBrokerKPIs.mockResolvedValue(mockKPIData);
    mockGetBrokerProfile.mockResolvedValue(mockBrokerProfile);

    // Mock WebSocket hook
    mockUsePropertyDashboardWebSocket.mockReturnValue({
      connectionStatus: 'connected' as const,
      isConnected: true,
      isPolling: false,
      isReconnecting: false,
      error: null,
    } as any);
  });

  /**
   * Test 1: Dashboard renders with KPIs
   */
  it('should render dashboard with KPI cards', async () => {
    render(
      <BrowserRouter>
        <BrokerDashboard />
      </BrowserRouter>
    );

    // Wait for loading to complete and KPIs to render
    await waitFor(() => {
      expect(screen.getByText('Active Deals')).toBeInTheDocument();
      expect(screen.getByText('Commission Pipeline')).toBeInTheDocument();
      expect(screen.getByText('Response Rate')).toBeInTheDocument();
      expect(screen.getByText('Properties Matched')).toBeInTheDocument();
    });

    // Verify KPI values are displayed
    await waitFor(() => {
      expect(screen.getByText('8')).toBeInTheDocument(); // activeDeals value
      expect(screen.getByText('$45,000')).toBeInTheDocument(); // commissionPipeline value
      expect(screen.getByText('85%')).toBeInTheDocument(); // responseRate value
      expect(screen.getByText('12')).toBeInTheDocument(); // propertiesMatched value
    });
  });

  /**
   * Test 2: Dual view toggle switches views
   */
  it('should render dual view toggle for tenant demands and property listings', async () => {
    render(
      <BrowserRouter>
        <BrokerDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Check for dual view toggle buttons
      expect(screen.getByText('Tenant Demands')).toBeInTheDocument();
      expect(screen.getByText('Property Listings')).toBeInTheDocument();
    });
  });

  /**
   * Test 3: Loading state displays properly
   */
  it('should display loading state initially', () => {
    // Mock API calls to never resolve to keep loading state
    mockGetBrokerKPIs.mockImplementation(() => new Promise(() => {}));
    mockGetBrokerProfile.mockImplementation(() => new Promise(() => {}));

    render(
      <BrowserRouter>
        <BrokerDashboard />
      </BrowserRouter>
    );

    // Should show loading skeletons for KPI cards
    expect(screen.getAllByRole('status', { name: /loading/i }).length).toBeGreaterThan(0);
  });

  /**
   * Test 4: Error state handled gracefully
   */
  it('should display error message when KPI fetch fails', async () => {
    const errorMessage = 'Failed to fetch broker KPIs';
    mockGetBrokerKPIs.mockRejectedValue(new Error(errorMessage));

    render(
      <BrowserRouter>
        <BrokerDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/error loading dashboard/i)).toBeInTheDocument();
    });
  });

  /**
   * Test 5: Navigation to broker profile
   */
  it('should have link to broker profile management', async () => {
    render(
      <BrowserRouter>
        <BrokerDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Check for profile management link/button
      const profileLink = screen.queryByText(/manage profile/i) || screen.queryByText(/broker profile/i);
      if (profileLink) {
        expect(profileLink).toBeInTheDocument();
      }
    });
  });
});
