/// <reference types="@testing-library/jest-dom" />
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Trends from '../pages/Trends';
import Applications from '../pages/Applications';
import Settings from '../pages/Settings';
import Profile from '../pages/Profile';
import BusinessDetail from '../pages/BusinessDetail';
import { PlaceholderPage } from '../components/PlaceholderPage';
import { AuthProvider } from '../contexts/AuthContext';
import * as apiClient from '../utils/apiClient';

// Mock the API client
jest.mock('../utils/apiClient');

// Mock AuthContext with tenant user
jest.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    user: {
      id: 'user-1',
      email: 'tenant@example.com',
      role: 'tenant',
      email_verified: true,
    },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

// Type assertion for mocked function
const mockGetBusinesses = apiClient.getBusinesses as jest.MockedFunction<typeof apiClient.getBusinesses>;

// Wrapper component for tests
const renderWithRouter = (component: React.ReactElement, initialRoute = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        {component}
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('PlaceholderPage Component', () => {
  it('should render with title and message', () => {
    renderWithRouter(
      <PlaceholderPage
        title="Test Title"
        message="Test message for placeholder"
      />
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test message for placeholder')).toBeInTheDocument();
  });

  it('should display tier badge when tierRequired is provided', () => {
    renderWithRouter(
      <PlaceholderPage
        title="Premium Feature"
        message="This feature requires an upgrade"
        tierRequired="Pro"
      />
    );

    expect(screen.getByText('Pro Tier')).toBeInTheDocument();
  });

  it('should show upgrade button when showUpgradeButton is true', async () => {
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

    renderWithRouter(
      <PlaceholderPage
        title="Premium Feature"
        message="Upgrade required"
        tierRequired="Pro"
        showUpgradeButton={true}
      />
    );

    const upgradeButton = screen.getByRole('button', { name: /upgrade to pro tier/i });
    expect(upgradeButton).toBeInTheDocument();

    alertMock.mockRestore();
  });

  it('should not show upgrade button when showUpgradeButton is false', () => {
    renderWithRouter(
      <PlaceholderPage
        title="Coming Soon"
        message="This feature is not yet available"
      />
    );

    const upgradeButton = screen.queryByRole('button', { name: /upgrade/i });
    expect(upgradeButton).not.toBeInTheDocument();
  });
});

describe('Trends Page', () => {
  it('should render with correct title and Pro tier message', () => {
    renderWithRouter(<Trends />);

    expect(screen.getByText('Market Trends')).toBeInTheDocument();
    expect(screen.getByText(/Coming Soon - This feature is available in Pro tier/i)).toBeInTheDocument();
    expect(screen.getByText('Pro Tier')).toBeInTheDocument();
  });

  it('should display upgrade button', () => {
    renderWithRouter(<Trends />);

    const upgradeButton = screen.getByRole('button', { name: /upgrade/i });
    expect(upgradeButton).toBeInTheDocument();
  });
});

describe('Applications Page', () => {
  it('should render with correct title and message', () => {
    renderWithRouter(<Applications />);

    expect(screen.getByText('Applications')).toBeInTheDocument();
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
  });

  it('should not display tier badge or upgrade button', () => {
    renderWithRouter(<Applications />);

    expect(screen.queryByText(/tier/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /upgrade/i })).not.toBeInTheDocument();
  });
});

describe('Settings Page', () => {
  it('should render with correct title and message', () => {
    renderWithRouter(<Settings />);

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Settings page coming soon')).toBeInTheDocument();
  });
});

describe('Profile Page', () => {
  it('should render with correct title and message', () => {
    renderWithRouter(<Profile />);

    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Profile editing coming soon')).toBeInTheDocument();
  });
});

describe('BusinessDetail Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load and display business selector when businesses exist', async () => {
    const mockBusinesses = {
      items: [
        {
          id: 'business-1',
          user_id: 'user-1',
          name: 'Test Restaurant',
          category: 'F&B',
          status: 'active',
          is_verified: true,
          logo_url: null,
          stealth_mode_enabled: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'business-2',
          user_id: 'user-1',
          name: 'Test Retail Store',
          category: 'Retail',
          status: 'active',
          is_verified: true,
          logo_url: null,
          stealth_mode_enabled: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      hasMore: false,
      total: 2,
    };

    mockGetBusinesses.mockResolvedValue(mockBusinesses as any);

    renderWithRouter(<BusinessDetail />, '/business/business-1');

    await waitFor(() => {
      expect(screen.getByLabelText(/select business to view details/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
    expect(screen.getByText('Test Retail Store')).toBeInTheDocument();
  });

  it('should display location tabs', async () => {
    const mockBusinesses = {
      items: [
        {
          id: 'business-1',
          user_id: 'user-1',
          name: 'Test Business',
          category: 'F&B',
          status: 'active',
          is_verified: true,
          logo_url: null,
          stealth_mode_enabled: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      hasMore: false,
      total: 1,
    };

    mockGetBusinesses.mockResolvedValue(mockBusinesses as any);

    renderWithRouter(<BusinessDetail />, '/business/business-1');

    await waitFor(() => {
      expect(screen.getByText('Miami')).toBeInTheDocument();
    });

    expect(screen.getByText('NYC')).toBeInTheDocument();
    expect(screen.getByText('Buffalo')).toBeInTheDocument();
  });

  it('should display performance funnel structure with coming soon overlay', async () => {
    const mockBusinesses = {
      items: [
        {
          id: 'business-1',
          user_id: 'user-1',
          name: 'Test Business',
          category: 'F&B',
          status: 'active',
          is_verified: true,
          logo_url: null,
          stealth_mode_enabled: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      hasMore: false,
      total: 1,
    };

    mockGetBusinesses.mockResolvedValue(mockBusinesses as any);

    renderWithRouter(<BusinessDetail />, '/business/business-1');

    await waitFor(() => {
      expect(screen.getByText('Performance Funnel')).toBeInTheDocument();
    });

    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    expect(screen.getByText(/Detailed business analytics and location-specific metrics/i)).toBeInTheDocument();
  });

  it('should show empty state when no businesses exist', async () => {
    const mockBusinesses = {
      items: [],
      hasMore: false,
      total: 0,
    };

    mockGetBusinesses.mockResolvedValue(mockBusinesses as any);

    renderWithRouter(<BusinessDetail />, '/business/business-1');

    await waitFor(() => {
      expect(screen.getByText('No Businesses Found')).toBeInTheDocument();
    });

    expect(screen.getByText('Create a business to view detailed analytics')).toBeInTheDocument();
  });

  it('should allow switching between location tabs', async () => {
    const mockBusinesses = {
      items: [
        {
          id: 'business-1',
          user_id: 'user-1',
          name: 'Test Business',
          category: 'F&B',
          status: 'active',
          is_verified: true,
          logo_url: null,
          stealth_mode_enabled: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      hasMore: false,
      total: 1,
    };

    mockGetBusinesses.mockResolvedValue(mockBusinesses as any);

    renderWithRouter(<BusinessDetail />, '/business/business-1');

    await waitFor(() => {
      expect(screen.getByText('Miami')).toBeInTheDocument();
    });

    const nycTab = screen.getByRole('button', { name: /view nyc location/i });
    expect(nycTab).toHaveAttribute('aria-pressed', 'true');
  });
});
