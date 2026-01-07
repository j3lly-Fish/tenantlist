import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TenantDemandsSection } from '@components/TenantDemandsSection';
import { DemandListing, DemandListingStatus } from '@types';

// Mock child components
jest.mock('@components/SearchInput', () => ({
  SearchInput: ({ value, onChange, placeholder }: any) => (
    <input
      data-testid="search-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
}));

jest.mock('@components/FilterDropdown', () => ({
  FilterDropdown: ({ value, onChange, options, label }: any) => (
    <select
      data-testid="filter-dropdown"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
    >
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
}));

jest.mock('@components/EmptyState', () => ({
  EmptyState: ({ title, description }: any) => (
    <div data-testid="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  ),
}));

jest.mock('@components/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}));

const mockDemands: DemandListing[] = [
  {
    id: '1',
    business_id: 'biz1',
    title: 'Retail Space Needed',
    description: 'Looking for retail space in downtown',
    location_name: 'New York, NY',
    min_sqft: 1000,
    max_sqft: 2000,
    min_budget: 5000,
    max_budget: 8000,
    start_date: '2024-06-01',
    industry: 'Retail',
    asset_type: 'Retail',
    requirements: {},
    match_percentage: '80',
    status: DemandListingStatus.ACTIVE,
    lot_size: null,
    is_corporate_location: false,
    additional_features: [],
    stealth_mode: false,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: '2',
    business_id: 'biz2',
    title: 'Office Space',
    description: 'Need office space for tech startup',
    location_name: 'San Francisco, CA',
    min_sqft: 2000,
    max_sqft: 3000,
    min_budget: 10000,
    max_budget: 15000,
    start_date: '2024-07-01',
    industry: 'Technology',
    asset_type: 'Office',
    requirements: {},
    match_percentage: '90',
    status: DemandListingStatus.PENDING,
    lot_size: null,
    is_corporate_location: false,
    additional_features: [],
    stealth_mode: false,
    created_at: new Date(),
    updated_at: new Date(),
  },
];

describe('TenantDemandsSection', () => {
  const defaultProps = {
    demands: mockDemands,
    loading: false,
    searchQuery: '',
    onSearchChange: jest.fn(),
    statusFilter: 'all',
    onStatusFilterChange: jest.fn(),
    hasActiveFilters: false,
    onClearFilters: jest.fn(),
    onDemandClick: jest.fn(),
    hasMore: false,
    isLoadingMore: false,
    totalCount: 2,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders section title with count', () => {
    render(<TenantDemandsSection {...defaultProps} />);
    expect(screen.getByText('Tenant Demands (2)')).toBeInTheDocument();
  });

  it('renders all demands', () => {
    render(<TenantDemandsSection {...defaultProps} />);
    expect(screen.getByText('Retail Space Needed')).toBeInTheDocument();
    expect(screen.getByText('Office Space')).toBeInTheDocument();
  });

  it('displays demand details correctly', () => {
    render(<TenantDemandsSection {...defaultProps} />);

    expect(screen.getByText('New York, NY')).toBeInTheDocument();
    expect(screen.getByText('1,000 - 2,000 sq ft')).toBeInTheDocument();
    expect(screen.getByText('$5,000 - $8,000/mo')).toBeInTheDocument();
    expect(screen.getByText('Retail')).toBeInTheDocument();
  });

  it('renders search input with correct placeholder', () => {
    render(<TenantDemandsSection {...defaultProps} />);
    const searchInput = screen.getByTestId('search-input');
    expect(searchInput).toHaveAttribute('placeholder', 'Search demands...');
  });

  it('calls onSearchChange when search input changes', () => {
    const onSearchChange = jest.fn();
    render(<TenantDemandsSection {...defaultProps} onSearchChange={onSearchChange} />);

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'retail' } });

    expect(onSearchChange).toHaveBeenCalledWith('retail');
  });

  it('renders status filter dropdown', () => {
    render(<TenantDemandsSection {...defaultProps} />);
    expect(screen.getByTestId('filter-dropdown')).toBeInTheDocument();
  });

  it('calls onStatusFilterChange when filter changes', () => {
    const onStatusFilterChange = jest.fn();
    render(<TenantDemandsSection {...defaultProps} onStatusFilterChange={onStatusFilterChange} />);

    const filterDropdown = screen.getByTestId('filter-dropdown');
    fireEvent.change(filterDropdown, { target: { value: 'active' } });

    expect(onStatusFilterChange).toHaveBeenCalledWith('active');
  });

  it('shows clear filters button when filters are active', () => {
    render(<TenantDemandsSection {...defaultProps} hasActiveFilters={true} />);
    expect(screen.getByText('Clear Filters')).toBeInTheDocument();
  });

  it('calls onClearFilters when clear button is clicked', () => {
    const onClearFilters = jest.fn();
    render(<TenantDemandsSection {...defaultProps} hasActiveFilters={true} onClearFilters={onClearFilters} />);

    const clearButton = screen.getByText('Clear Filters');
    fireEvent.click(clearButton);

    expect(onClearFilters).toHaveBeenCalled();
  });

  it('calls onDemandClick when demand card is clicked', () => {
    const onDemandClick = jest.fn();
    render(<TenantDemandsSection {...defaultProps} onDemandClick={onDemandClick} />);

    const demandCard = screen.getByText('Retail Space Needed').closest('[role="button"]');
    fireEvent.click(demandCard!);

    expect(onDemandClick).toHaveBeenCalledWith('1');
  });

  it('handles keyboard navigation on demand cards', () => {
    const onDemandClick = jest.fn();
    render(<TenantDemandsSection {...defaultProps} onDemandClick={onDemandClick} />);

    const demandCard = screen.getByText('Retail Space Needed').closest('[role="button"]');

    fireEvent.keyDown(demandCard!, { key: 'Enter' });
    expect(onDemandClick).toHaveBeenCalledWith('1');

    fireEvent.keyDown(demandCard!, { key: ' ' });
    expect(onDemandClick).toHaveBeenCalledTimes(2);
  });

  it('shows skeleton loaders when loading', () => {
    render(<TenantDemandsSection {...defaultProps} loading={true} demands={[]} />);

    // Should show 6 skeleton cards
    const skeletons = screen.getAllByRole('generic').filter(el =>
      el.className.includes('demandCardSkeleton')
    );
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no demands and not loading', () => {
    render(<TenantDemandsSection {...defaultProps} demands={[]} />);
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByText('No tenant demands found')).toBeInTheDocument();
  });

  it('shows loading spinner when loading more', () => {
    render(<TenantDemandsSection {...defaultProps} isLoadingMore={true} />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText('Loading more demands...')).toBeInTheDocument();
  });

  it('displays status badges correctly', () => {
    render(<TenantDemandsSection {...defaultProps} />);
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
  });

  it('truncates long descriptions', () => {
    const longDescriptionDemand: DemandListing = {
      ...mockDemands[0],
      id: '3',
      description: 'A'.repeat(150),
    };

    render(<TenantDemandsSection {...defaultProps} demands={[longDescriptionDemand]} />);

    const description = screen.getByText(/A{120}\.\.\./);
    expect(description).toBeInTheDocument();
  });

  it('formats budget range correctly', () => {
    render(<TenantDemandsSection {...defaultProps} />);
    expect(screen.getByText('$5,000 - $8,000/mo')).toBeInTheDocument();
  });

  it('formats square footage range correctly', () => {
    render(<TenantDemandsSection {...defaultProps} />);
    expect(screen.getByText('1,000 - 2,000 sq ft')).toBeInTheDocument();
  });

  it('formats start date correctly', () => {
    render(<TenantDemandsSection {...defaultProps} />);
    // Check that a date is displayed (format may vary)
    expect(screen.getByText(/6\/1\/2024|2024/)).toBeInTheDocument();
  });

  it('handles demands without title', () => {
    const noTitleDemand: DemandListing = {
      ...mockDemands[0],
      id: '4',
      title: null,
    };

    render(<TenantDemandsSection {...defaultProps} demands={[noTitleDemand]} />);
    expect(screen.getByText('Retail Space')).toBeInTheDocument();
  });

  it('renders with proper ARIA labels', () => {
    render(<TenantDemandsSection {...defaultProps} />);
    expect(screen.getByRole('region', { name: 'Tenant Demands' })).toBeInTheDocument();
  });
});
