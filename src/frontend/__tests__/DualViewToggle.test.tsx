import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DualViewToggle, ViewMode } from '@components/DualViewToggle';

describe('DualViewToggle', () => {
  const mockOnViewChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders both view options', () => {
    render(
      <DualViewToggle
        activeView="demands"
        onViewChange={mockOnViewChange}
      />
    );

    expect(screen.getByRole('tab', { name: /tenant demands/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /property listings/i })).toBeInTheDocument();
  });

  it('shows active state for demands view', () => {
    render(
      <DualViewToggle
        activeView="demands"
        onViewChange={mockOnViewChange}
      />
    );

    const demandsButton = screen.getByRole('tab', { name: /tenant demands/i });
    expect(demandsButton).toHaveAttribute('aria-selected', 'true');
  });

  it('shows active state for properties view', () => {
    render(
      <DualViewToggle
        activeView="properties"
        onViewChange={mockOnViewChange}
      />
    );

    const propertiesButton = screen.getByRole('tab', { name: /property listings/i });
    expect(propertiesButton).toHaveAttribute('aria-selected', 'true');
  });

  it('calls onViewChange when demands button is clicked', () => {
    render(
      <DualViewToggle
        activeView="properties"
        onViewChange={mockOnViewChange}
      />
    );

    const demandsButton = screen.getByRole('tab', { name: /tenant demands/i });
    fireEvent.click(demandsButton);

    expect(mockOnViewChange).toHaveBeenCalledWith('demands');
    expect(mockOnViewChange).toHaveBeenCalledTimes(1);
  });

  it('calls onViewChange when properties button is clicked', () => {
    render(
      <DualViewToggle
        activeView="demands"
        onViewChange={mockOnViewChange}
      />
    );

    const propertiesButton = screen.getByRole('tab', { name: /property listings/i });
    fireEvent.click(propertiesButton);

    expect(mockOnViewChange).toHaveBeenCalledWith('properties');
    expect(mockOnViewChange).toHaveBeenCalledTimes(1);
  });

  it('displays counts when provided', () => {
    render(
      <DualViewToggle
        activeView="demands"
        onViewChange={mockOnViewChange}
        demandsCount={15}
        propertiesCount={42}
      />
    );

    expect(screen.getByText('(15)')).toBeInTheDocument();
    expect(screen.getByText('(42)')).toBeInTheDocument();
  });

  it('does not display counts when not provided', () => {
    render(
      <DualViewToggle
        activeView="demands"
        onViewChange={mockOnViewChange}
      />
    );

    expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument();
  });

  it('renders with proper ARIA roles', () => {
    render(
      <DualViewToggle
        activeView="demands"
        onViewChange={mockOnViewChange}
      />
    );

    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(2);
  });

  it('sets proper aria-controls attributes', () => {
    render(
      <DualViewToggle
        activeView="demands"
        onViewChange={mockOnViewChange}
      />
    );

    const demandsButton = screen.getByRole('tab', { name: /tenant demands/i });
    const propertiesButton = screen.getByRole('tab', { name: /property listings/i });

    expect(demandsButton).toHaveAttribute('aria-controls', 'demands-panel');
    expect(propertiesButton).toHaveAttribute('aria-controls', 'properties-panel');
  });

  it('handles keyboard navigation', () => {
    render(
      <DualViewToggle
        activeView="demands"
        onViewChange={mockOnViewChange}
      />
    );

    const demandsButton = screen.getByRole('tab', { name: /tenant demands/i });
    demandsButton.focus();
    expect(demandsButton).toHaveFocus();
  });

  it('renders active indicator element', () => {
    const { container } = render(
      <DualViewToggle
        activeView="demands"
        onViewChange={mockOnViewChange}
      />
    );

    const indicator = container.querySelector('[aria-hidden="true"]');
    expect(indicator).toBeInTheDocument();
  });

  it('updates indicator position for properties view', () => {
    const { container } = render(
      <DualViewToggle
        activeView="properties"
        onViewChange={mockOnViewChange}
      />
    );

    const indicator = container.querySelector('[aria-hidden="true"]');
    expect(indicator).toHaveStyle({ transform: 'translateX(100%)' });
  });

  it('displays zero counts correctly', () => {
    render(
      <DualViewToggle
        activeView="demands"
        onViewChange={mockOnViewChange}
        demandsCount={0}
        propertiesCount={0}
      />
    );

    expect(screen.getByText('(0)')).toBeInTheDocument();
  });
});
