import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { TenantProfileCard, TenantProfile } from '@components/broker/TenantProfileCard';

/**
 * Tests for TenantProfileCard Component
 *
 * Test Coverage:
 * - Rendering tenant profile information
 * - Logo display with fallback
 * - Verified badge display
 * - Rating and review count
 * - Location display
 * - Click navigation
 * - Keyboard navigation
 */

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('TenantProfileCard', () => {
  const mockTenant: TenantProfile = {
    id: 'tenant-1',
    display_name: 'Starbucks Coffee',
    logo_url: 'https://example.com/logo.png',
    category: 'Quick Service Retail',
    rating: 4.8,
    review_count: 245,
    is_verified: true,
    city: 'Dallas',
    state: 'TX',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  it('renders tenant profile information', () => {
    renderWithRouter(<TenantProfileCard tenant={mockTenant} />);

    expect(screen.getByText('Starbucks Coffee')).toBeInTheDocument();
    expect(screen.getByText('Quick Service Retail')).toBeInTheDocument();
    expect(screen.getByText('4.8')).toBeInTheDocument();
    expect(screen.getByText('(245 Reviews)')).toBeInTheDocument();
    expect(screen.getByText('Dallas, TX')).toBeInTheDocument();
  });

  it('renders logo image with alt text', () => {
    renderWithRouter(<TenantProfileCard tenant={mockTenant} />);

    const logo = screen.getByAltText('Starbucks Coffee logo');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', 'https://example.com/logo.png');
  });

  it('renders fallback logo when logo_url is null', () => {
    const tenantWithoutLogo = { ...mockTenant, logo_url: null };
    renderWithRouter(<TenantProfileCard tenant={tenantWithoutLogo} />);

    const logo = screen.getByAltText('Starbucks Coffee logo');
    expect(logo).toBeInTheDocument();
    // Fallback uses data URL with initials
    expect(logo.getAttribute('src')).toContain('data:image/svg+xml');
  });

  it('displays verified badge when tenant is verified', () => {
    renderWithRouter(<TenantProfileCard tenant={mockTenant} />);

    const verifiedBadge = screen.getByLabelText('Verified tenant');
    expect(verifiedBadge).toBeInTheDocument();
  });

  it('hides verified badge when tenant is not verified', () => {
    const unverifiedTenant = { ...mockTenant, is_verified: false };
    renderWithRouter(<TenantProfileCard tenant={unverifiedTenant} />);

    const verifiedBadge = screen.queryByLabelText('Verified tenant');
    expect(verifiedBadge).not.toBeInTheDocument();
  });

  it('displays singular "Review" for review_count = 1', () => {
    const tenantWithOneReview = { ...mockTenant, review_count: 1 };
    renderWithRouter(<TenantProfileCard tenant={tenantWithOneReview} />);

    expect(screen.getByText('(1 Review)')).toBeInTheDocument();
  });

  it('displays plural "Reviews" for review_count > 1', () => {
    renderWithRouter(<TenantProfileCard tenant={mockTenant} />);

    expect(screen.getByText('(245 Reviews)')).toBeInTheDocument();
  });

  it('formats rating to one decimal place', () => {
    const tenantWithRating = { ...mockTenant, rating: 4.5 };
    renderWithRouter(<TenantProfileCard tenant={tenantWithRating} />);

    expect(screen.getByText('4.5')).toBeInTheDocument();
  });

  it('displays location with both city and state', () => {
    renderWithRouter(<TenantProfileCard tenant={mockTenant} />);

    expect(screen.getByText('Dallas, TX')).toBeInTheDocument();
  });

  it('displays only city when state is missing', () => {
    const tenantWithCityOnly = { ...mockTenant, state: undefined };
    renderWithRouter(<TenantProfileCard tenant={tenantWithCityOnly} />);

    expect(screen.getByText('Dallas')).toBeInTheDocument();
  });

  it('displays only state when city is missing', () => {
    const tenantWithStateOnly = { ...mockTenant, city: undefined };
    renderWithRouter(<TenantProfileCard tenant={tenantWithStateOnly} />);

    expect(screen.getByText('TX')).toBeInTheDocument();
  });

  it('hides location when both city and state are missing', () => {
    const tenantWithoutLocation = { ...mockTenant, city: undefined, state: undefined };
    renderWithRouter(<TenantProfileCard tenant={tenantWithoutLocation} />);

    const locationIcon = screen.queryByRole('img', { hidden: true });
    const locationTexts = screen.queryAllByText(/,/); // Location format includes comma
    expect(locationTexts).toHaveLength(0);
  });

  it('does not render category when category is null', () => {
    const tenantWithoutCategory = { ...mockTenant, category: null };
    renderWithRouter(<TenantProfileCard tenant={tenantWithoutCategory} />);

    const category = screen.queryByText('Quick Service Retail');
    expect(category).not.toBeInTheDocument();
  });

  it('navigates to tenant profile page on click', () => {
    renderWithRouter(<TenantProfileCard tenant={mockTenant} />);

    const card = screen.getByRole('button');
    fireEvent.click(card);

    expect(mockNavigate).toHaveBeenCalledWith('/broker/tenant-profile/tenant-1');
  });

  it('calls custom onClick handler if provided', () => {
    const mockOnClick = jest.fn();
    renderWithRouter(<TenantProfileCard tenant={mockTenant} onClick={mockOnClick} />);

    const card = screen.getByRole('button');
    fireEvent.click(card);

    expect(mockOnClick).toHaveBeenCalledWith('tenant-1');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates on Enter key press', () => {
    renderWithRouter(<TenantProfileCard tenant={mockTenant} />);

    const card = screen.getByRole('button');
    fireEvent.keyPress(card, { key: 'Enter', code: 'Enter', charCode: 13 });

    expect(mockNavigate).toHaveBeenCalledWith('/broker/tenant-profile/tenant-1');
  });

  it('navigates on Space key press', () => {
    renderWithRouter(<TenantProfileCard tenant={mockTenant} />);

    const card = screen.getByRole('button');
    fireEvent.keyPress(card, { key: ' ', code: 'Space', charCode: 32 });

    expect(mockNavigate).toHaveBeenCalledWith('/broker/tenant-profile/tenant-1');
  });

  it('has correct accessibility attributes', () => {
    renderWithRouter(<TenantProfileCard tenant={mockTenant} />);

    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('aria-label', 'View profile for Starbucks Coffee');
    expect(card).toHaveAttribute('tabIndex', '0');
  });
});
