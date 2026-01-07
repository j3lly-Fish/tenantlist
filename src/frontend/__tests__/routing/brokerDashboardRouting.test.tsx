/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom';
import { UserRole } from '@types';
import { BrokerLayout } from '@pages/broker/BrokerLayout';
import Overview from '@pages/broker/Overview';
import TenantListings from '@pages/broker/TenantListings';
import PropertyListings from '@pages/broker/PropertyListings';
import ReviewPerformance from '@pages/broker/ReviewPerformance';
import ListingMatches from '@pages/broker/ListingMatches';
import InviteClients from '@pages/broker/InviteClients';

// Mock TopNavigation to avoid circular dependencies
jest.mock('@components/TopNavigation', () => ({
  TopNavigation: () => <div data-testid="top-navigation">TopNavigation</div>,
}));

// Mock BrokerSidebar
jest.mock('@components/broker/BrokerSidebar', () => ({
  BrokerSidebar: ({ onNavigate }: { onNavigate?: () => void }) => (
    <div data-testid="broker-sidebar">
      <button onClick={onNavigate}>Navigate</button>
    </div>
  ),
}));

// Mock useAuth hook
const mockUseAuth = jest.fn();
jest.mock('@contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock ProtectedRoute to just render children
const MockProtectedRoute = ({ children }: { children: React.ReactNode; roles?: UserRole[] }) => <>{children}</>;
jest.mock('@components/ProtectedRoute', () => ({
  __esModule: true,
  default: MockProtectedRoute,
}));

describe('Broker Dashboard Routing', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      role: UserRole.BROKER,
      user: {
        id: 'broker-1',
        email: 'broker@test.com',
        firstName: 'Test',
        lastName: 'Broker',
        role: UserRole.BROKER,
      },
      login: jest.fn(),
      logout: jest.fn(),
      checkAuth: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderWithRouter = (initialRoute: string = '/broker/overview') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/broker" element={<BrokerLayout />}>
            <Route path="overview" element={<Overview />} />
            <Route path="tenant-listings" element={<TenantListings />} />
            <Route path="property-listings" element={<PropertyListings />} />
            <Route path="review-performance" element={<ReviewPerformance />} />
            <Route path="listing-matches" element={<ListingMatches />} />
            <Route path="invite-clients" element={<InviteClients />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders BrokerLayout with TopNavigation and sidebar', async () => {
    renderWithRouter('/broker/overview');

    await waitFor(() => {
      expect(screen.getByTestId('top-navigation')).toBeInTheDocument();
      expect(screen.getByTestId('broker-sidebar')).toBeInTheDocument();
    });
  });

  it('renders Overview page at /broker/overview route', async () => {
    renderWithRouter('/broker/overview');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Overview', level: 1 })).toBeInTheDocument();
      expect(screen.getByText(/Monitor your performance and track key metrics/i)).toBeInTheDocument();
    });
  });

  it('renders TenantListings page at /broker/tenant-listings route', async () => {
    renderWithRouter('/broker/tenant-listings');

    await waitFor(() => {
      expect(screen.getByText(/Tenant Overview/i)).toBeInTheDocument();
      expect(screen.getByText(/Monitor your properties to seek tenant engagement/i)).toBeInTheDocument();
    });
  });

  it('renders PropertyListings page at /broker/property-listings route', async () => {
    renderWithRouter('/broker/property-listings');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Property Listings', level: 1 })).toBeInTheDocument();
      expect(screen.getByText(/Browse and manage property listings/i)).toBeInTheDocument();
    });
  });

  it('renders ReviewPerformance page at /broker/review-performance route', async () => {
    renderWithRouter('/broker/review-performance');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Review Performance', level: 1 })).toBeInTheDocument();
      expect(screen.getByText(/Analyze your performance metrics/i)).toBeInTheDocument();
    });
  });

  it('renders ListingMatches page at /broker/listing-matches route', async () => {
    renderWithRouter('/broker/listing-matches');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Listing Matches', level: 1 })).toBeInTheDocument();
      expect(screen.getByText(/Discover property and tenant matches/i)).toBeInTheDocument();
    });
  });

  it('renders InviteClients page at /broker/invite-clients route', async () => {
    renderWithRouter('/broker/invite-clients');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Invite Clients', level: 1 })).toBeInTheDocument();
      expect(screen.getByText(/Send invitations to potential clients/i)).toBeInTheDocument();
    });
  });

  it('maintains nested route structure within BrokerLayout', async () => {
    renderWithRouter('/broker/overview');

    await waitFor(() => {
      // Layout components should be present
      expect(screen.getByTestId('top-navigation')).toBeInTheDocument();
      expect(screen.getByTestId('broker-sidebar')).toBeInTheDocument();
      // Page content should be present
      expect(screen.getByRole('heading', { name: 'Overview', level: 1 })).toBeInTheDocument();
    });
  });
});
