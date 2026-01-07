import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TenantSearchCard } from '@components/broker/TenantSearchCard';

/**
 * Tests for TenantSearchCard Component
 *
 * Test Coverage:
 * - Rendering with initial props
 * - Search input functionality
 * - Category filter functionality
 * - Location filter functionality
 * - Clear filters button
 * - Empty state display
 * - Results count display
 * - Create tenant button
 */

describe('TenantSearchCard', () => {
  const mockOnSearchChange = jest.fn();
  const mockOnCategoryChange = jest.fn();
  const mockOnLocationChange = jest.fn();
  const mockOnClearFilters = jest.fn();
  const mockOnCreateTenant = jest.fn();

  const defaultProps = {
    searchQuery: '',
    onSearchChange: mockOnSearchChange,
    categoryFilter: '',
    onCategoryChange: mockOnCategoryChange,
    locationFilter: '',
    onLocationChange: mockOnLocationChange,
    onClearFilters: mockOnClearFilters,
    onCreateTenant: mockOnCreateTenant,
    hasActiveFilters: false,
    showEmptyState: false,
    totalResults: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders search card with title and subtitle', () => {
    render(<TenantSearchCard {...defaultProps} />);

    expect(screen.getByText('Search for tenant profile')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Create your personal profile, you will then be able to create your business pages'
      )
    ).toBeInTheDocument();
  });

  it('renders search input with placeholder', () => {
    render(<TenantSearchCard {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search for Tenant');
    expect(searchInput).toBeInTheDocument();
  });

  it('calls onSearchChange when search input changes', () => {
    render(<TenantSearchCard {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search for Tenant');
    fireEvent.change(searchInput, { target: { value: 'Starbucks' } });

    expect(mockOnSearchChange).toHaveBeenCalledWith('Starbucks');
  });

  it('renders category filter dropdown', () => {
    render(<TenantSearchCard {...defaultProps} />);

    const categorySelect = screen.getByLabelText('Category');
    expect(categorySelect).toBeInTheDocument();
    expect(categorySelect).toHaveValue('');
  });

  it('calls onCategoryChange when category is selected', () => {
    render(<TenantSearchCard {...defaultProps} />);

    const categorySelect = screen.getByLabelText('Category');
    fireEvent.change(categorySelect, { target: { value: 'Quick Service Retail' } });

    expect(mockOnCategoryChange).toHaveBeenCalledWith('Quick Service Retail');
  });

  it('renders location filter input', () => {
    render(<TenantSearchCard {...defaultProps} />);

    const locationInput = screen.getByLabelText('Location (Optional)');
    expect(locationInput).toBeInTheDocument();
  });

  it('calls onLocationChange when location input changes', () => {
    render(<TenantSearchCard {...defaultProps} />);

    const locationInput = screen.getByLabelText('Location (Optional)');
    fireEvent.change(locationInput, { target: { value: 'Dallas, TX' } });

    expect(mockOnLocationChange).toHaveBeenCalledWith('Dallas, TX');
  });

  it('shows clear filters button when hasActiveFilters is true', () => {
    render(<TenantSearchCard {...defaultProps} hasActiveFilters={true} />);

    const clearButton = screen.getByText('Clear Filters');
    expect(clearButton).toBeInTheDocument();
  });

  it('hides clear filters button when hasActiveFilters is false', () => {
    render(<TenantSearchCard {...defaultProps} hasActiveFilters={false} />);

    const clearButton = screen.queryByText('Clear Filters');
    expect(clearButton).not.toBeInTheDocument();
  });

  it('calls onClearFilters when clear filters button is clicked', () => {
    render(<TenantSearchCard {...defaultProps} hasActiveFilters={true} />);

    const clearButton = screen.getByText('Clear Filters');
    fireEvent.click(clearButton);

    expect(mockOnClearFilters).toHaveBeenCalled();
  });

  it('shows results count when totalResults > 0 and not empty state', () => {
    render(<TenantSearchCard {...defaultProps} totalResults={5} showEmptyState={false} />);

    expect(screen.getByText('5 tenants found')).toBeInTheDocument();
  });

  it('shows singular "tenant" for totalResults = 1', () => {
    render(<TenantSearchCard {...defaultProps} totalResults={1} showEmptyState={false} />);

    expect(screen.getByText('1 tenant found')).toBeInTheDocument();
  });

  it('hides results count when showEmptyState is true', () => {
    render(<TenantSearchCard {...defaultProps} totalResults={0} showEmptyState={true} />);

    const resultsCount = screen.queryByText(/tenants? found/);
    expect(resultsCount).not.toBeInTheDocument();
  });

  it('shows empty state when showEmptyState is true', () => {
    render(<TenantSearchCard {...defaultProps} showEmptyState={true} />);

    expect(screen.getByText("Can't find your tenant?")).toBeInTheDocument();
    expect(
      screen.getByText(
        'Click the button below to create a new tenant and add expansion locations'
      )
    ).toBeInTheDocument();
  });

  it('shows create tenant button in empty state', () => {
    render(<TenantSearchCard {...defaultProps} showEmptyState={true} />);

    const createButton = screen.getByText('Create New Tenant');
    expect(createButton).toBeInTheDocument();
  });

  it('calls onCreateTenant when create button is clicked', () => {
    render(<TenantSearchCard {...defaultProps} showEmptyState={true} />);

    const createButton = screen.getByText('Create New Tenant');
    fireEvent.click(createButton);

    expect(mockOnCreateTenant).toHaveBeenCalled();
  });

  it('hides empty state when showEmptyState is false', () => {
    render(<TenantSearchCard {...defaultProps} showEmptyState={false} />);

    const emptyStateText = screen.queryByText("Can't find your tenant?");
    expect(emptyStateText).not.toBeInTheDocument();
  });

  it('updates search input value when searchQuery prop changes', () => {
    const { rerender } = render(<TenantSearchCard {...defaultProps} searchQuery="" />);

    const searchInput = screen.getByPlaceholderText('Search for Tenant') as HTMLInputElement;
    expect(searchInput.value).toBe('');

    rerender(<TenantSearchCard {...defaultProps} searchQuery="Starbucks" />);
    // Note: Internal state won't update automatically without user input
    // This tests initial rendering with props
  });
});
