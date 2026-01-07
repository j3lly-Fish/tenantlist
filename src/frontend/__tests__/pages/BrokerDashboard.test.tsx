import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import BrokerDashboard from '@pages/BrokerDashboard';
import { AuthContext } from '@contexts/AuthContext';
import * as apiClient from '@utils/apiClient';

// Mock dependencies
jest.mock('@utils/apiClient');
jest.mock('@hooks/useBrokerDashboardWebSocket', () => ({
  useBrokerDashboardWebSocket: jest.fn(() => ({
    connectionStatus: 'connected',
    isConnected: true,
    isPolling: false,
    isReconnecting: false,
    refresh: jest.fn(),
  })),
}));
jest.mock('@hooks/useInfiniteScroll', () => ({
  useInfiniteScroll: jest.fn(() => ({
    sentinelRef: { current: null },
  })),
}));

// Mock components
jest.mock('@components/TopNavigation', () => ({
  TopNavigation: ({ tier }: any) => <div data-testid="top-navigation">Navigation - {tier}</div>,
}));

jest.mock('@components/ConnectionIndicator', () => ({
  ConnectionIndicator: ({ connectionStatus }: any) => (
    <div data-testid="connection-indicator">{connectionStatus}</div>
  ),
}));

jest.mock('@components/KPICard', () => ({
  KPICard: ({ title, value, loading }: any) => (
    <div data-testid={`kpi-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      {loading ? 'Loading...' : `${title}: ${value}`}
    </div>
  ),
}));

jest.mock('@components/DualViewToggle', () => ({
  DualViewToggle: ({ activeView, onViewChange, demandsCount, propertiesCount }: any) => (
    <div data-testid="dual-view-toggle">
      <button onClick={() => onViewChange('demands')}>Demands ({demandsCount})</button>
      <button onClick={() => onViewChange('properties')}>Properties ({propertiesCount})</button>
      <div>Active: {activeView}</div>
    </div>
  ),
}));

jest.mock('@components/TenantDemandsSection', () => ({
  TenantDemandsSection: ({ demands, loading }: any) => (
    <div data-testid="tenant-demands-section">
      {loading ? 'Loading demands...' : `${demands.length} demands`}
    </div>
  ),
}));

jest.mock('@components/PropertyListingsSection', () => ({
  PropertyListingsSection: ({ properties, loading }: any) => (
    <div data-testid="property-listings-section">
      {loading ? 'Loading properties...' : `${properties.length} properties`}
    </div>
  ),
}));

jest.mock('@components/BrokerProfileModal', () => ({
  BrokerProfileModal: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="broker-profile-modal">
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null,
}));

const mockKPIs = {
  activeDeals: { value: 5, trend: { direction: 'up', percentage: 10 } },
  commissionPipeline: { value: 50000, trend: { direction: 'up', percentage: 15 } },
  responseRate: { value: 85, trend: { direction: 'down', percentage: 5 } },
  propertiesMatched: { value: 12, trend: { direction: 'up', percentage: 20 } },
};

const mockBrokerProfile = {
  id: '1',
  user_id: 'user1',
  company_name: 'ABC Realty',
  license_number: '12345',
  license_state: 'CA',
  specialties: ['Retail', 'Office'],
  bio: 'Experienced broker',
  website_url: 'https://abcrealty.com',
  years_experience: 10,
  total_deals_closed: 50,
  total_commission_earned: 1000000,
  created_at: new Date(),
  updated_at: new Date(),
};

const mockDemands = [
  {
    id: '1',
    title: 'Retail Space',
    location_name: 'NYC',
    status: 'active',
  },
  {
    id: '2',
    title: 'Office Space',
    location_name: 'SF',
    status: 'active',
  },
];

const mockProperties = [
  {
    id: '1',
    title: 'Commercial Property 1',
    address: 'NYC',
    status: 'active',
  },
  {
    id: '2',
    title: 'Commercial Property 2',
    address: 'LA',
    status: 'active',
  },
];

const mockUser = {
  userId: 'user1',
  email: 'test@test.com',
  role: 'broker',
};

const renderWithAuth = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={{ user: mockUser, login: jest.fn(), logout: jest.fn(), isAuthenticated: true } as any}>
        {component}
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('BrokerDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default API mocks
    (apiClient.getBrokerKPIs as jest.Mock).mockResolvedValue(mockKPIs);
    (apiClient.getBrokerProfile as jest.Mock).mockResolvedValue(mockBrokerProfile);
    (apiClient.getBrokerDemands as jest.Mock).mockResolvedValue({
      demands: mockDemands,
      total: 2,
      hasMore: false,
    });
    (apiClient.getBrokerProperties as jest.Mock).mockResolvedValue({
      properties: mockProperties,
      total: 2,
      hasMore: false,
    });
  });

  describe('Initial Render', () => {
    it('renders top navigation with broker tier', async () => {
      renderWithAuth(<BrokerDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('top-navigation')).toHaveTextContent('Broker');
      });
    });

    it('renders connection indicator', async () => {
      renderWithAuth(<BrokerDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('connection-indicator')).toBeInTheDocument();
      });
    });

    it('displays page title and subtitle', async () => {
      renderWithAuth(<BrokerDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Broker Dashboard')).toBeInTheDocument();
        expect(screen.getByText('ABC Realty')).toBeInTheDocument();
      });
    });

    it('displays all KPI cards', async () => {
      renderWithAuth(<BrokerDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('kpi-active-deals')).toBeInTheDocument();
        expect(screen.getByTestId('kpi-commission-pipeline')).toBeInTheDocument();
        expect(screen.getByTestId('kpi-response-rate')).toBeInTheDocument();
        expect(screen.getByTestId('kpi-properties-matched')).toBeInTheDocument();
      });
    });

    it('renders dual view toggle', async () => {
      renderWithAuth(<BrokerDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('dual-view-toggle')).toBeInTheDocument();
      });
    });
  });

  describe('Data Loading', () => {
    it('loads KPIs on mount', async () => {
      renderWithAuth(<BrokerDashboard />);

      await waitFor(() => {
        expect(apiClient.getBrokerKPIs).toHaveBeenCalled();
      });
    });

    it('loads broker profile on mount', async () => {
      renderWithAuth(<BrokerDashboard />);

      await waitFor(() => {
        expect(apiClient.getBrokerProfile).toHaveBeenCalled();
      });
    });

    it('loads tenant demands on mount', async () => {
      renderWithAuth(<BrokerDashboard />);

      await waitFor(() => {
        expect(apiClient.getBrokerDemands).toHaveBeenCalledWith(
          expect.objectContaining({ page: 1, limit: 20 })
        );
      });
    });

    it('loads property listings on mount', async () => {
      renderWithAuth(<BrokerDashboard />);

      await waitFor(() => {
        expect(apiClient.getBrokerProperties).toHaveBeenCalledWith(
          expect.objectContaining({ page: 1, limit: 20 })
        );
      });
    });

    it('displays KPI values after loading', async () => {
      renderWithAuth(<BrokerDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('kpi-active-deals')).toHaveTextContent('5');
        expect(screen.getByTestId('kpi-commission-pipeline')).toHaveTextContent('50000');
        expect(screen.getByTestId('kpi-response-rate')).toHaveTextContent('85');
        expect(screen.getByTestId('kpi-properties-matched')).toHaveTextContent('12');
      });
    });
  });

  describe('Broker Profile', () => {
    it('shows "Manage Profile" button when profile exists', async () => {
      renderWithAuth(<BrokerDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Manage Profile')).toBeInTheDocument();
      });
    });

    it('shows "Create Profile" button when profile does not exist', async () => {
      (apiClient.getBrokerProfile as jest.Mock).mockRejectedValue(new Error('Not found'));

      renderWithAuth(<BrokerDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Create Profile')).toBeInTheDocument();
      });
    });

    it('opens modal when profile button is clicked', async () => {
      renderWithAuth(<BrokerDashboard />);

      await waitFor(() => {
        const profileButton = screen.getByText('Manage Profile');
        fireEvent.click(profileButton);
      });

      expect(screen.getByTestId('broker-profile-modal')).toBeInTheDocument();
    });

    it('closes modal when close button is clicked', async () => {
      renderWithAuth(<BrokerDashboard />);

      await waitFor(() => {
        const profileButton = screen.getByText('Manage Profile');
        fireEvent.click(profileButton);
      });

      const closeButton = screen.getByText('Close Modal');
      fireEvent.click(closeButton);

      expect(screen.queryByTestId('broker-profile-modal')).not.toBeInTheDocument();
    });
  });

  describe('Dual View Toggle', () => {
    it('starts with demands view active', async () => {
      renderWithAuth(<BrokerDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Active: demands')).toBeInTheDocument();
      });
    });

    it('displays tenant demands section when demands view is active', async () => {
      renderWithAuth(<BrokerDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('tenant-demands-section')).toBeInTheDocument();
        expect(screen.queryByTestId('property-listings-section')).not.toBeInTheDocument();
      });
    });

    it('switches to properties view when toggle button is clicked', async () => {
      renderWithAuth(<BrokerDashboard />);

      await waitFor(() => {
        const propertiesButton = screen.getByText(/Properties \(/);
        fireEvent.click(propertiesButton);
      });

      expect(screen.getByTestId('property-listings-section')).toBeInTheDocument();
      expect(screen.queryByTestId('tenant-demands-section')).not.toBeInTheDocument();
    });

    it('displays correct counts in toggle buttons', async () => {
      renderWithAuth(<BrokerDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Demands (2)')).toBeInTheDocument();
        expect(screen.getByText('Properties (2)')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error state when data loading fails', async () => {
      (apiClient.getBrokerKPIs as jest.Mock).mockRejectedValue(new Error('Failed to load'));

      renderWithAuth(<BrokerDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Error Loading Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Failed to load')).toBeInTheDocument();
      });
    });

    it('shows retry button on error', async () => {
      (apiClient.getBrokerKPIs as jest.Mock).mockRejectedValue(new Error('Failed to load'));

      renderWithAuth(<BrokerDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('retries loading when retry button is clicked', async () => {
      (apiClient.getBrokerKPIs as jest.Mock)
        .mockRejectedValueOnce(new Error('Failed to load'))
        .mockResolvedValueOnce(mockKPIs);

      renderWithAuth(<BrokerDashboard />);

      await waitFor(() => {
        const retryButton = screen.getByText('Retry');
        fireEvent.click(retryButton);
      });

      await waitFor(() => {
        expect(apiClient.getBrokerKPIs).toHaveBeenCalledTimes(2);
      });
    });

    it('handles missing broker profile gracefully', async () => {
      (apiClient.getBrokerProfile as jest.Mock).mockRejectedValue(new Error('Not found'));

      renderWithAuth(<BrokerDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Manage your broker operations')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading state for KPI cards initially', () => {
      renderWithAuth(<BrokerDashboard />);

      expect(screen.getByTestId('kpi-active-deals')).toHaveTextContent('Loading...');
    });

    it('shows loading state for demands section initially', () => {
      renderWithAuth(<BrokerDashboard />);

      expect(screen.getByTestId('tenant-demands-section')).toHaveTextContent('Loading demands...');
    });
  });

  describe('WebSocket Integration', () => {
    it('uses broker dashboard WebSocket hook', () => {
      const useBrokerDashboardWebSocket = require('@hooks/useBrokerDashboardWebSocket').useBrokerDashboardWebSocket;

      renderWithAuth(<BrokerDashboard />);

      expect(useBrokerDashboardWebSocket).toHaveBeenCalledWith(
        'user1',
        true,
        expect.objectContaining({
          onKPIUpdate: expect.any(Function),
          onDealCreated: expect.any(Function),
          onDealUpdated: expect.any(Function),
        })
      );
    });
  });

  describe('Infinite Scroll', () => {
    it('sets up infinite scroll for demands', () => {
      const useInfiniteScroll = require('@hooks/useInfiniteScroll').useInfiniteScroll;

      renderWithAuth(<BrokerDashboard />);

      expect(useInfiniteScroll).toHaveBeenCalledWith(
        expect.any(Function),
        false, // hasMore
        false  // isLoading
      );
    });
  });
});
