import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { KPICard } from '../../frontend/components/KPICard';

describe('KPICard Trend Indicators', () => {
  it('should show up arrow and green color for positive trends', () => {
    const trend = {
      value: 12.5,
      direction: 'up' as const,
      period: 'vs last week'
    };

    render(
      <KPICard
        title="Active Listings"
        value={42}
        trend={trend}
      />
    );

    // Check for up arrow
    expect(screen.getByText(/↑/)).toBeInTheDocument();

    // Check for percentage
    expect(screen.getByText(/12.5%/)).toBeInTheDocument();

    // Check for period text
    expect(screen.getByText('vs last week')).toBeInTheDocument();

    // Check for green color class
    const trendElement = screen.getByText(/↑/).closest('div');
    expect(trendElement).toHaveClass('trendUp');
  });

  it('should show down arrow and red color for negative trends', () => {
    const trend = {
      value: -8.3,
      direction: 'down' as const,
      period: 'vs last week'
    };

    render(
      <KPICard
        title="Avg Days on Market"
        value={28}
        trend={trend}
      />
    );

    // Check for down arrow
    expect(screen.getByText(/↓/)).toBeInTheDocument();

    // Check for percentage (should be absolute value)
    expect(screen.getByText(/8.3%/)).toBeInTheDocument();

    // Check for red color class
    const trendElement = screen.getByText(/↓/).closest('div');
    expect(trendElement).toHaveClass('trendDown');
  });

  it('should show dash and gray color for neutral trends', () => {
    const trend = {
      value: 0,
      direction: 'neutral' as const,
      period: 'vs last week'
    };

    render(
      <KPICard
        title="Response Rate"
        value={15.5}
        suffix="%"
        trend={trend}
      />
    );

    // Check for neutral indicator
    expect(screen.getByText(/→/)).toBeInTheDocument();

    // Check for 0%
    expect(screen.getByText(/0%/)).toBeInTheDocument();

    // Check for gray color class
    const trendElement = screen.getByText(/→/).closest('div');
    expect(trendElement).toHaveClass('trendNeutral');
  });

  it('should display loading skeleton when loading is true', () => {
    render(
      <KPICard
        title="Total Listings"
        value={0}
        loading={true}
      />
    );

    // Value should show loading state
    expect(screen.getByText('...')).toBeInTheDocument();

    // Should not show trend when loading
    expect(screen.queryByText(/↑|↓|→/)).not.toBeInTheDocument();
  });

  it('should not display trend indicator when trend prop is not provided', () => {
    render(
      <KPICard
        title="Total Listings"
        value={42}
      />
    );

    // Should not show any trend indicators
    expect(screen.queryByText(/↑|↓|→/)).not.toBeInTheDocument();
    expect(screen.queryByText(/vs last week/)).not.toBeInTheDocument();
  });

  it('should handle trend with loading state gracefully', () => {
    const trend = {
      value: 12.5,
      direction: 'up' as const,
      period: 'vs last week'
    };

    render(
      <KPICard
        title="Active Listings"
        value={0}
        trend={trend}
        loading={true}
      />
    );

    // Should show loading state and hide trend
    expect(screen.getByText('...')).toBeInTheDocument();
    expect(screen.queryByText(/↑/)).not.toBeInTheDocument();
  });
});
