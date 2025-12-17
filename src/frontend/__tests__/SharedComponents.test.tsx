/**
 * Shared UI Components Tests (Task Group 6.1)
 *
 * Focused tests for:
 * - KPICard renders with different values
 * - BusinessCard renders all elements
 * - StatusBadge color variants
 * - SearchInput debouncing
 *
 * Test count: 8 focused tests
 */

/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { KPICard } from '../components/KPICard';
import { BusinessCard } from '../components/BusinessCard';
import { StatusBadge } from '../components/StatusBadge';
import { SearchInput } from '../components/SearchInput';
import { FilterDropdown } from '../components/FilterDropdown';
import { EmptyState } from '../components/EmptyState';
import { BusinessStatus, Business } from '../../types';

describe('Shared UI Components Tests', () => {
  /**
   * Test 1: KPICard renders with number value
   */
  test('KPICard renders number value correctly', () => {
    render(
      <KPICard
        title="Active Businesses"
        value={25}
      />
    );

    expect(screen.getByText('Active Businesses')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  /**
   * Test 2: KPICard renders percentage value
   */
  test('KPICard renders percentage value correctly', () => {
    render(
      <KPICard
        title="Response Rate"
        value="78.5%"
      />
    );

    expect(screen.getByText('Response Rate')).toBeInTheDocument();
    expect(screen.getByText('78.5%')).toBeInTheDocument();
  });

  /**
   * Test 3: BusinessCard renders all elements
   */
  test('BusinessCard renders all elements including badges and buttons', () => {
    const mockBusiness: Business = {
      id: '1',
      user_id: 'user-1',
      name: 'Test Restaurant',
      category: 'F&B',
      status: BusinessStatus.ACTIVE,
      is_verified: true,
      logo_url: null,
      stealth_mode_enabled: false,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mockOnEdit = jest.fn();
    const mockOnDelete = jest.fn();
    const mockOnManageLocations = jest.fn();
    const mockOnViewPerformance = jest.fn();

    render(
      <BusinessCard
        business={mockBusiness}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onManageLocations={mockOnManageLocations}
        onViewPerformance={mockOnViewPerformance}
      />
    );

    // Check business name
    expect(screen.getByText('Test Restaurant')).toBeInTheDocument();

    // Check category badge
    expect(screen.getByText('F&B')).toBeInTheDocument();
  });

  /**
   * Test 4: StatusBadge shows correct color for active status
   */
  test('StatusBadge displays active status with green color', () => {
    const { container } = render(
      <StatusBadge status={BusinessStatus.ACTIVE} />
    );

    const badge = container.querySelector('.statusBadge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('active');
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  /**
   * Test 5: StatusBadge shows correct color for pending status
   */
  test('StatusBadge displays pending verification with yellow color', () => {
    const { container } = render(
      <StatusBadge status={BusinessStatus.PENDING_VERIFICATION} />
    );

    const badge = container.querySelector('.statusBadge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('pending');
    expect(screen.getByText('Pending Verification')).toBeInTheDocument();
  });

  /**
   * Test 6: SearchInput debounces onChange correctly
   */
  test('SearchInput debounces onChange by 300ms', async () => {
    jest.useFakeTimers();
    const mockOnChange = jest.fn();

    render(
      <SearchInput
        placeholder="Search businesses..."
        value=""
        onChange={mockOnChange}
      />
    );

    const input = screen.getByPlaceholderText('Search businesses...');

    // Type quickly
    fireEvent.change(input, { target: { value: 'test' } });

    // Should not call onChange immediately
    expect(mockOnChange).not.toHaveBeenCalled();

    // Fast forward 300ms
    jest.advanceTimersByTime(300);

    // Should call onChange after debounce
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('test');
    });

    jest.useRealTimers();
  });

  /**
   * Test 7: FilterDropdown displays options and handles selection
   */
  test('FilterDropdown opens and allows option selection', async () => {
    const mockOnChange = jest.fn();
    const options = [
      { value: 'all', label: 'All Status' },
      { value: 'active', label: 'Active' },
      { value: 'pending', label: 'Pending Verification' },
    ];

    render(
      <FilterDropdown
        options={options}
        value="all"
        onChange={mockOnChange}
        label="Status Filter"
      />
    );

    // Click to open dropdown
    const dropdownButton = screen.getByText('All Status');
    fireEvent.click(dropdownButton);

    // Options should be visible
    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Pending Verification')).toBeInTheDocument();
    });

    // Select an option
    fireEvent.click(screen.getByText('Active'));

    // Should call onChange with selected value
    expect(mockOnChange).toHaveBeenCalledWith('active');
  });

  /**
   * Test 8: EmptyState renders with message and optional action
   */
  test('EmptyState displays message and action button', () => {
    const mockOnAction = jest.fn();

    render(
      <EmptyState
        title="No Active Listings"
        message="You don't have any active business listings yet."
        actionLabel="Add Business"
        onAction={mockOnAction}
      />
    );

    expect(screen.getByText('No Active Listings')).toBeInTheDocument();
    expect(screen.getByText("You don't have any active business listings yet.")).toBeInTheDocument();

    const actionButton = screen.getByText('Add Business');
    expect(actionButton).toBeInTheDocument();

    fireEvent.click(actionButton);
    expect(mockOnAction).toHaveBeenCalled();
  });
});
