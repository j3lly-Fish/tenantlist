import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@contexts/AuthContext';
import { ToastProvider } from '@contexts/ToastContext';
import Dashboard from '@pages/Dashboard';
import MyBusinesses from '@pages/MyBusinesses';
import '@testing-library/jest-dom';

// Mock the API client
jest.mock('@utils/apiClient', () => ({
  getDashboardData: jest.fn(),
  getBusinesses: jest.fn(),
}));

// Mock useAuth hook
jest.mock('@contexts/AuthContext', () => ({
  ...jest.requireActual('@contexts/AuthContext'),
  useAuth: () => ({
    user: {
      userId: 'test-user-id',
      email: 'test@example.com',
      role: 'tenant',
      firstName: 'Test',
      lastName: 'User',
    },
    isAuthenticated: true,
    isLoading: false,
    role: 'tenant',
    login: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
    setUser: jest.fn(),
  }),
}));

// Mock WebSocket hook
jest.mock('@hooks/useDashboardWebSocket', () => ({
  useDashboardWebSocket: () => ({
    isConnected: true,
    isFallbackPolling: false,
  }),
}));

// Mock components
jest.mock('@components/TopNavigation', () => ({
  TopNavigation: () => <div data-testid="top-navigation">TopNavigation</div>,
}));

jest.mock('@components/DashboardHeader', () => ({
  DashboardHeader: () => <div data-testid="dashboard-header">Dashboard Header</div>,
}));

jest.mock('@components/KPICardsSection', () => ({
  KPICardsSection: () => <div data-testid="kpi-cards">KPI Cards</div>,
}));

jest.mock('@components/BusinessListingsSection', () => ({
  BusinessListingsSection: () => <div data-testid="business-listings">Business Listings</div>,
}));

jest.mock('@components/ConnectionIndicator', () => ({
  ConnectionIndicator: () => <div data-testid="connection-indicator">Connection Indicator</div>,
}));

const mockBusinesses = [
  {
    id: 'business-1',
    name: 'Test Business 1',
    logo_url: 'https://example.com/logo1.png',
    category: 'Retail',
    status: 'active',
    is_verified: true,
  },
  {
    id: 'business-2',
    name: 'Test Business 2',
    logo_url: null,
    category: 'Restaurant',
    status: 'active',
    is_verified: false,
  },
];

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          {component}
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('TenantDashboardIntegration', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('8.1 Complete User Flows', () => {
    it('should complete flow: blur overlay -> search -> add existing business', async () => {
      // Mock initial API call with 0 businesses
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/api/user/businesses') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                data: { businesses: [], count: 0 },
              }),
          });
        }
        if (url.includes('/api/businesses/search')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                businesses: mockBusinesses,
                total: 2,
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      });

      const { getDashboardData } = require('@utils/apiClient');
      getDashboardData.mockResolvedValue({
        businesses: [],
        kpis: {
          activeBusinesses: 0,
          responseRate: '0%',
          landlordViews: 0,
          messagesTotal: 0,
        },
        total: 0,
      });

      renderWithProviders(<Dashboard />);

      // Wait for blur overlay to appear
      await waitFor(() => {
        expect(screen.getByTestId('blur-overlay')).toBeInTheDocument();
      });

      // Click "+ Add Business" button on blur overlay
      const addBusinessButton = within(screen.getByTestId('blur-overlay-card')).getByRole(
        'button',
        { name: /add/i }
      );
      fireEvent.click(addBusinessButton);

      // Wait for GlobalBusinessSearch modal to open
      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /select your business profile/i })).toBeInTheDocument();
      });

      // Type in search input
      const searchInput = screen.getByPlaceholderText('Search for your business');
      fireEvent.change(searchInput, { target: { value: 'Test Business' } });

      // Wait for search results
      await waitFor(() => {
        expect(screen.getByText('Test Business 1')).toBeInTheDocument();
      });

      // Mock POST /api/user/businesses to add business
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url === '/api/user/businesses' && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                data: { businessId: 'business-1' },
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { businesses: [mockBusinesses[0]], count: 1 } }),
        });
      });

      // Update getDashboardData mock to return business after addition
      getDashboardData.mockResolvedValue({
        businesses: [mockBusinesses[0]],
        kpis: {
          activeBusinesses: 1,
          responseRate: '0%',
          landlordViews: 0,
          messagesTotal: 0,
        },
        total: 1,
      });

      // Click on business to add it
      const businessCard = screen.getByText('Test Business 1');
      fireEvent.click(businessCard);

      // Wait for modal to close and blur overlay to disappear
      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: /select your business profile/i })).not.toBeInTheDocument();
      });
    });

    it('should complete flow: blur overlay -> create new -> personal form -> business creation', async () => {
      // Mock initial API call with 0 businesses
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url === '/api/user/businesses' && options?.method === 'GET') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                data: { businesses: [], count: 0 },
              }),
          });
        }
        if (url.includes('/api/businesses/search')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ businesses: [], total: 0 }),
          });
        }
        if (url === '/api/businesses/check-duplicate') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ exists: false }),
          });
        }
        if (url === '/api/user/profile' && options?.method === 'PUT') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: {} }),
          });
        }
        if (url === '/api/businesses' && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                data: { id: 'new-business-id', name: 'New Business' },
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      });

      const { getDashboardData } = require('@utils/apiClient');
      getDashboardData.mockResolvedValue({
        businesses: [],
        kpis: {
          activeBusinesses: 0,
          responseRate: '0%',
          landlordViews: 0,
          messagesTotal: 0,
        },
        total: 0,
      });

      renderWithProviders(<Dashboard />);

      // Wait for blur overlay to appear
      await waitFor(() => {
        expect(screen.getByTestId('blur-overlay')).toBeInTheDocument();
      });

      // Click "+ Add Business" button
      const addBusinessButton = within(screen.getByTestId('blur-overlay-card')).getByRole(
        'button',
        { name: /add/i }
      );
      fireEvent.click(addBusinessButton);

      // Wait for GlobalBusinessSearch modal
      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /select your business profile/i })).toBeInTheDocument();
      });

      // Type a business name that doesn't exist
      const searchInput = screen.getByPlaceholderText('Search for your business');
      fireEvent.change(searchInput, { target: { value: 'New Business' } });

      // Wait for "Can't find your business?" message
      await waitFor(() => {
        expect(screen.getByText("Can't find your business?")).toBeInTheDocument();
      });

      // Click "Create New Business" button
      const createButton = screen.getByRole('button', { name: /create new business/i });
      fireEvent.click(createButton);

      // Wait for PersonalAccountForm to open
      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /create your personal account/i })).toBeInTheDocument();
      });

      // Fill out the form
      fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByLabelText(/company name/i), { target: { value: 'New Business' } });
      fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '(310) 123-4567' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create personal account/i });
      fireEvent.click(submitButton);

      // Wait for form submission and modal to close
      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: /create your personal account/i })).not.toBeInTheDocument();
      });
    });

    it('should remove blur overlay after business is added', async () => {
      // Start with 0 businesses
      let businessCount = 0;
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url === '/api/user/businesses' && options?.method === 'GET') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                data: {
                  businesses: businessCount > 0 ? [mockBusinesses[0]] : [],
                  count: businessCount,
                },
              }),
          });
        }
        if (url === '/api/user/businesses' && options?.method === 'POST') {
          businessCount = 1;
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                data: { businessId: 'business-1' },
              }),
          });
        }
        if (url.includes('/api/businesses/search')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ businesses: mockBusinesses, total: 2 }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      });

      const { getDashboardData } = require('@utils/apiClient');
      getDashboardData.mockResolvedValue({
        businesses: [],
        kpis: {
          activeBusinesses: 0,
          responseRate: '0%',
          landlordViews: 0,
          messagesTotal: 0,
        },
        total: 0,
      });

      renderWithProviders(<Dashboard />);

      // Verify blur overlay is visible
      await waitFor(() => {
        expect(screen.getByTestId('blur-overlay')).toBeInTheDocument();
      });

      // Click "+ Add Business" button
      const addBusinessButton = within(screen.getByTestId('blur-overlay-card')).getByRole(
        'button',
        { name: /add/i }
      );
      fireEvent.click(addBusinessButton);

      // Wait for modal and search
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search for your business');
      fireEvent.change(searchInput, { target: { value: 'Test' } });

      await waitFor(() => {
        expect(screen.getByText('Test Business 1')).toBeInTheDocument();
      });

      // Update dashboard mock to return business
      getDashboardData.mockResolvedValue({
        businesses: [mockBusinesses[0]],
        kpis: {
          activeBusinesses: 1,
          responseRate: '0%',
          landlordViews: 0,
          messagesTotal: 0,
        },
        total: 1,
      });

      // Select business
      const businessCard = screen.getByText('Test Business 1');
      fireEvent.click(businessCard);

      // Wait for modal to close and blur overlay to be removed
      await waitFor(() => {
        expect(screen.queryByTestId('blur-overlay')).not.toBeInTheDocument();
      });
    });

    it('should update business count across TenantDashboard and MyBusinesses', async () => {
      let businessCount = 0;
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url === '/api/user/businesses' && options?.method === 'GET') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                data: {
                  businesses: businessCount > 0 ? [mockBusinesses[0]] : [],
                  count: businessCount,
                },
              }),
          });
        }
        if (url === '/api/user/businesses' && options?.method === 'POST') {
          businessCount = 1;
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                data: { businessId: 'business-1' },
              }),
          });
        }
        if (url.includes('/api/businesses/search')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ businesses: mockBusinesses, total: 2 }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      });

      // Render MyBusinesses page
      renderWithProviders(<MyBusinesses />);

      // Wait for initial load with count 0
      await waitFor(() => {
        expect(screen.getByText(/portfolio overview \(0\)/i)).toBeInTheDocument();
      });

      // Click "+ Add Business" button
      const addBusinessButton = screen.getByRole('button', { name: /add new business/i });
      fireEvent.click(addBusinessButton);

      // Wait for modal
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search for your business');
      fireEvent.change(searchInput, { target: { value: 'Test' } });

      await waitFor(() => {
        expect(screen.getByText('Test Business 1')).toBeInTheDocument();
      });

      // Select business
      const businessCard = screen.getByText('Test Business 1');
      fireEvent.click(businessCard);

      // Wait for count to update
      await waitFor(() => {
        expect(screen.getByText(/portfolio overview \(1\)/i)).toBeInTheDocument();
      });
    });
  });

  describe('8.2-8.4 Modal Integration', () => {
    it('should open GlobalBusinessSearch from TenantDashboard blur overlay', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { businesses: [], count: 0 } }),
      });

      const { getDashboardData } = require('@utils/apiClient');
      getDashboardData.mockResolvedValue({
        businesses: [],
        kpis: {
          activeBusinesses: 0,
          responseRate: '0%',
          landlordViews: 0,
          messagesTotal: 0,
        },
        total: 0,
      });

      renderWithProviders(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('blur-overlay')).toBeInTheDocument();
      });

      const addBusinessButton = within(screen.getByTestId('blur-overlay-card')).getByRole(
        'button',
        { name: /add/i }
      );
      fireEvent.click(addBusinessButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /select your business profile/i })).toBeInTheDocument();
      });
    });

    it('should open GlobalBusinessSearch from MyBusinesses "+ Add Business" button', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { businesses: [], count: 0 } }),
      });

      renderWithProviders(<MyBusinesses />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add new business/i })).toBeInTheDocument();
      });

      const addBusinessButton = screen.getByRole('button', { name: /add new business/i });
      fireEvent.click(addBusinessButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /select your business profile/i })).toBeInTheDocument();
      });
    });

    it('should open PersonalAccountForm from GlobalBusinessSearch when creating new business', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url === '/api/user/businesses') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: { businesses: [], count: 0 } }),
          });
        }
        if (url.includes('/api/businesses/search')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ businesses: [], total: 0 }),
          });
        }
        if (url === '/api/businesses/check-duplicate') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ exists: false }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      });

      renderWithProviders(<MyBusinesses />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add new business/i })).toBeInTheDocument();
      });

      // Open GlobalBusinessSearch
      fireEvent.click(screen.getByRole('button', { name: /add new business/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /select your business profile/i })).toBeInTheDocument();
      });

      // Search for non-existent business
      const searchInput = screen.getByPlaceholderText('Search for your business');
      fireEvent.change(searchInput, { target: { value: 'New Business' } });

      await waitFor(() => {
        expect(screen.getByText("Can't find your business?")).toBeInTheDocument();
      });

      // Click "Create New Business"
      const createButton = screen.getByRole('button', { name: /create new business/i });
      fireEvent.click(createButton);

      // Wait for PersonalAccountForm to open
      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /create your personal account/i })).toBeInTheDocument();
      });
    });

    it('should handle duplicate detection and return to search', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        if (url === '/api/user/businesses') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: { businesses: [], count: 0 } }),
          });
        }
        if (url.includes('/api/businesses/search')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ businesses: [], total: 0 }),
          });
        }
        if (url === '/api/businesses/check-duplicate') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ exists: true, business: mockBusinesses[0] }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      });

      renderWithProviders(<MyBusinesses />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add new business/i })).toBeInTheDocument();
      });

      // Open modal
      fireEvent.click(screen.getByRole('button', { name: /add new business/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Search and try to create
      const searchInput = screen.getByPlaceholderText('Search for your business');
      fireEvent.change(searchInput, { target: { value: 'Test Business' } });

      await waitFor(() => {
        expect(screen.getByText("Can't find your business?")).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /create new business/i });
      fireEvent.click(createButton);

      // Wait for duplicate warning
      await waitFor(() => {
        expect(
          screen.getByText(/this business already exists/i)
        ).toBeInTheDocument();
      });

      // Should still be on GlobalBusinessSearch modal (not PersonalAccountForm)
      expect(screen.getByRole('dialog', { name: /select your business profile/i })).toBeInTheDocument();
    });
  });

  describe('8.7 Modal Behavior', () => {
    it('should close modal on backdrop click', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { businesses: [], count: 0 } }),
      });

      renderWithProviders(<MyBusinesses />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add new business/i })).toBeInTheDocument();
      });

      // Open modal
      fireEvent.click(screen.getByRole('button', { name: /add new business/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click backdrop
      const backdrop = screen.getByRole('presentation');
      fireEvent.click(backdrop);

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should close modal on Escape key press', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { businesses: [], count: 0 } }),
      });

      renderWithProviders(<MyBusinesses />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add new business/i })).toBeInTheDocument();
      });

      // Open modal
      fireEvent.click(screen.getByRole('button', { name: /add new business/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Press Escape key
      const backdrop = screen.getByRole('presentation');
      fireEvent.keyDown(backdrop, { key: 'Escape', code: 'Escape' });

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });
});
