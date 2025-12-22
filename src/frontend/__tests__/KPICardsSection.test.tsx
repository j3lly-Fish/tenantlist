/// <reference types="@testing-library/jest-dom" />
import { render, screen } from '@testing-library/react';
import { KPICardsSection } from '../components/KPICardsSection';

describe('KPICardsSection', () => {
  const mockKPIData = {
    activeBusinesses: 5,
    performance: 85,
    responseRate: 75,
    landlordViews: 1250,
  };

  it('should render 4 KPI cards', () => {
    render(<KPICardsSection {...mockKPIData} loading={false} />);

    // Check that all 4 card titles are present
    expect(screen.getByText('Active Businesses')).toBeInTheDocument();
    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.getByText('Response Rate')).toBeInTheDocument();
    expect(screen.getByText('Landlord Views')).toBeInTheDocument();
  });

  it('should display values correctly for each card', () => {
    render(<KPICardsSection {...mockKPIData} loading={false} />);

    // Check values are displayed correctly
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('1,250')).toBeInTheDocument();
  });

  it('should display icons for each KPI type', () => {
    render(<KPICardsSection {...mockKPIData} loading={false} />);

    // Check for icons by their test ids
    expect(screen.getByTestId('icon-building')).toBeInTheDocument();
    expect(screen.getByTestId('icon-chart')).toBeInTheDocument();
    expect(screen.getByTestId('icon-message')).toBeInTheDocument();
    expect(screen.getByTestId('icon-eye')).toBeInTheDocument();
  });

  it('should show loading skeletons when loading is true', () => {
    render(<KPICardsSection {...mockKPIData} loading={true} />);

    // Check for loading state - values should show loading indicator
    const loadingIndicators = screen.getAllByText('...');
    expect(loadingIndicators.length).toBe(4);
  });

  it('should handle zero values gracefully', () => {
    const zeroData = {
      activeBusinesses: 0,
      performance: 0,
      responseRate: 0,
      landlordViews: 0,
    };

    render(<KPICardsSection {...zeroData} loading={false} />);

    // Check that zero values are displayed (Performance and Response Rate both show 0%)
    const zeroPercents = screen.getAllByText('0%');
    expect(zeroPercents.length).toBe(2); // Performance and Response Rate

    // Check for the plain "0" values (Active Businesses and Landlord Views)
    const zeroValues = screen.getAllByText('0');
    expect(zeroValues.length).toBe(2);
  });

  it('should have proper grid container for responsive layout', () => {
    const { container } = render(<KPICardsSection {...mockKPIData} loading={false} />);

    // Check for grid container class
    const gridContainer = container.querySelector('[class*="kpiCardsGrid"]');
    expect(gridContainer).toBeInTheDocument();
  });
});
