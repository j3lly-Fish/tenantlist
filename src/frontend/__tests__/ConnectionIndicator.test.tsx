import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConnectionIndicator } from '../components/ConnectionIndicator';

describe('ConnectionIndicator Component', () => {
  it('should render with correct status for "connected" state', () => {
    render(<ConnectionIndicator connectionStatus="connected" />);

    // Check for the "Live" text
    expect(screen.getByText('Live')).toBeInTheDocument();

    // Check for status role and aria-label
    const indicator = screen.getByRole('status');
    expect(indicator).toHaveAttribute('aria-label', 'Connection status: Live');
  });

  it('should render with correct status for "reconnecting" state', () => {
    render(<ConnectionIndicator connectionStatus="reconnecting" />);

    // Check for the "Reconnecting..." text
    expect(screen.getByText('Reconnecting...')).toBeInTheDocument();

    // Check for status role and aria-label
    const indicator = screen.getByRole('status');
    expect(indicator).toHaveAttribute('aria-label', 'Connection status: Reconnecting...');
  });

  it('should render with correct status for "polling" state', () => {
    render(<ConnectionIndicator connectionStatus="polling" />);

    // Check for the "Polling" text
    expect(screen.getByText('Polling')).toBeInTheDocument();

    // Check for status role and aria-label
    const indicator = screen.getByRole('status');
    expect(indicator).toHaveAttribute('aria-label', 'Connection status: Polling');
  });

  it('should render with correct status for "disconnected" state', () => {
    render(<ConnectionIndicator connectionStatus="disconnected" />);

    // Check for the "Disconnected" text
    expect(screen.getByText('Disconnected')).toBeInTheDocument();

    // Check for status role and aria-label
    const indicator = screen.getByRole('status');
    expect(indicator).toHaveAttribute('aria-label', 'Connection status: Disconnected');
  });

  it('should display appropriate visual indicator (green) for connected status', () => {
    const { container } = render(<ConnectionIndicator connectionStatus="connected" />);

    // Check for the dot with connected class
    const dot = container.querySelector('.connected');
    expect(dot).toBeInTheDocument();
  });

  it('should display appropriate visual indicator (yellow) for reconnecting status', () => {
    const { container } = render(<ConnectionIndicator connectionStatus="reconnecting" />);

    // Check for the dot with reconnecting class (should have pulse animation)
    const dot = container.querySelector('.reconnecting');
    expect(dot).toBeInTheDocument();
  });

  it('should display appropriate visual indicator (blue) for polling status', () => {
    const { container } = render(<ConnectionIndicator connectionStatus="polling" />);

    // Check for the dot with polling class
    const dot = container.querySelector('.polling');
    expect(dot).toBeInTheDocument();
  });

  it('should display appropriate visual indicator (red) for disconnected status', () => {
    const { container } = render(<ConnectionIndicator connectionStatus="disconnected" />);

    // Check for the dot with disconnected class
    const dot = container.querySelector('.disconnected');
    expect(dot).toBeInTheDocument();
  });

  it('should update when status changes from connected to polling', () => {
    const { rerender } = render(<ConnectionIndicator connectionStatus="connected" />);

    // Initially should show "Live"
    expect(screen.getByText('Live')).toBeInTheDocument();

    // Change to polling
    rerender(<ConnectionIndicator connectionStatus="polling" />);

    // Should now show "Polling"
    expect(screen.getByText('Polling')).toBeInTheDocument();
    expect(screen.queryByText('Live')).not.toBeInTheDocument();
  });

  it('should update when status changes from disconnected to connected', () => {
    const { rerender } = render(<ConnectionIndicator connectionStatus="disconnected" />);

    // Initially should show "Disconnected"
    expect(screen.getByText('Disconnected')).toBeInTheDocument();

    // Change to connected
    rerender(<ConnectionIndicator connectionStatus="connected" />);

    // Should now show "Live"
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.queryByText('Disconnected')).not.toBeInTheDocument();
  });

  it('should have aria-live="polite" for accessibility', () => {
    const { container } = render(<ConnectionIndicator connectionStatus="connected" />);

    const indicator = container.querySelector('[aria-live="polite"]');
    expect(indicator).toBeInTheDocument();
  });
});
