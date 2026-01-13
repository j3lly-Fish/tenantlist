import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BusinessProfileBlurOverlay } from '@components/BusinessProfileBlurOverlay';

describe('BusinessProfileBlurOverlay', () => {
  const mockOnAddBusinessClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render overlay when isVisible is true', () => {
    render(
      <BusinessProfileBlurOverlay
        isVisible={true}
        onAddBusinessClick={mockOnAddBusinessClick}
      />
    );

    expect(screen.getByText('Begin your journey')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Add your businesses and space needs so landlords can begin sending you locations.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add your first business' })).toBeInTheDocument();
  });

  it('should not render overlay when isVisible is false', () => {
    render(
      <BusinessProfileBlurOverlay
        isVisible={false}
        onAddBusinessClick={mockOnAddBusinessClick}
      />
    );

    expect(screen.queryByText('Begin your journey')).not.toBeInTheDocument();
  });

  it('should call onAddBusinessClick when "+ Add Business" button is clicked', () => {
    render(
      <BusinessProfileBlurOverlay
        isVisible={true}
        onAddBusinessClick={mockOnAddBusinessClick}
      />
    );

    const addButton = screen.getByRole('button', { name: 'Add your first business' });
    fireEvent.click(addButton);

    expect(mockOnAddBusinessClick).toHaveBeenCalledTimes(1);
  });

  it('should apply blur overlay backdrop with proper test id', () => {
    const { container } = render(
      <BusinessProfileBlurOverlay
        isVisible={true}
        onAddBusinessClick={mockOnAddBusinessClick}
      />
    );

    const overlay = container.querySelector('[data-testid="blur-overlay"]');
    expect(overlay).toBeInTheDocument();
    // Verify the overlay has CSS class that applies backdrop-filter
    expect(overlay).toHaveClass('overlay');
  });

  it('should have proper ARIA attributes for accessibility', () => {
    render(
      <BusinessProfileBlurOverlay
        isVisible={true}
        onAddBusinessClick={mockOnAddBusinessClick}
      />
    );

    const overlay = screen.getByRole('dialog');
    expect(overlay).toHaveAttribute('aria-modal', 'true');
    expect(overlay).toHaveAttribute('aria-labelledby', 'blur-overlay-title');
    expect(overlay).toHaveAttribute('aria-describedby', 'blur-overlay-description');
  });

  it('should display title with correct styling', () => {
    render(
      <BusinessProfileBlurOverlay
        isVisible={true}
        onAddBusinessClick={mockOnAddBusinessClick}
      />
    );

    const title = screen.getByText('Begin your journey');
    expect(title).toBeInTheDocument();
    // Title should have proper styling (32px, semi-bold)
    expect(title.tagName).toBe('H2');
    expect(title).toHaveAttribute('id', 'blur-overlay-title');
    expect(title).toHaveClass('title');
  });

  it('should display subtitle with correct styling', () => {
    render(
      <BusinessProfileBlurOverlay
        isVisible={true}
        onAddBusinessClick={mockOnAddBusinessClick}
      />
    );

    const subtitle = screen.getByText(
      'Add your businesses and space needs so landlords can begin sending you locations.'
    );
    expect(subtitle).toBeInTheDocument();
    expect(subtitle.tagName).toBe('P');
    expect(subtitle).toHaveAttribute('id', 'blur-overlay-description');
    expect(subtitle).toHaveClass('subtitle');
  });

  it('should render centered card with proper structure', () => {
    const { container } = render(
      <BusinessProfileBlurOverlay
        isVisible={true}
        onAddBusinessClick={mockOnAddBusinessClick}
      />
    );

    const overlay = container.querySelector('[data-testid="blur-overlay"]');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass('overlay');

    const card = container.querySelector('[data-testid="blur-overlay-card"]');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('card');
  });

  it('should hide overlay and remove from DOM when business is added', () => {
    const { rerender } = render(
      <BusinessProfileBlurOverlay
        isVisible={true}
        onAddBusinessClick={mockOnAddBusinessClick}
      />
    );

    expect(screen.getByText('Begin your journey')).toBeInTheDocument();

    // Simulate business being added (isVisible becomes false)
    rerender(
      <BusinessProfileBlurOverlay
        isVisible={false}
        onAddBusinessClick={mockOnAddBusinessClick}
      />
    );

    expect(screen.queryByText('Begin your journey')).not.toBeInTheDocument();
  });
});
