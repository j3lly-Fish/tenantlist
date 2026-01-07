import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TenantRequestForm } from '@components/broker/TenantRequestForm';
import apiClient from '@utils/apiClient';

// Mock apiClient
jest.mock('@utils/apiClient');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('TenantRequestForm Component', () => {
  const mockOnRequestSubmit = jest.fn();
  const defaultProps = {
    tenantId: 'tenant-123',
    tenantName: 'Starbucks Coffee',
    onRequestSubmit: mockOnRequestSubmit,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form with all fields', () => {
    render(<TenantRequestForm {...defaultProps} />);

    expect(screen.getByText(/request administrative approval/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tenant email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tenant pin/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send for review/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<TenantRequestForm {...defaultProps} />);

    const submitButton = screen.getByRole('button', { name: /send for review/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/pin is required/i)).toBeInTheDocument();
    });

    expect(mockedApiClient.post).not.toHaveBeenCalled();
  });

  it('validates email format', async () => {
    render(<TenantRequestForm {...defaultProps} />);

    const emailInput = screen.getByLabelText(/tenant email/i);
    const submitButton = screen.getByRole('button', { name: /send for review/i });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  it('validates PIN format (3 digits)', async () => {
    render(<TenantRequestForm {...defaultProps} />);

    const pinInput = screen.getByLabelText(/tenant pin/i);
    const submitButton = screen.getByRole('button', { name: /send for review/i });

    // Test with 2 digits
    fireEvent.change(pinInput, { target: { value: '12' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/pin must be exactly 3 digits/i)).toBeInTheDocument();
    });

    // Test with non-numeric
    fireEvent.change(pinInput, { target: { value: 'abc' } });
    expect(pinInput).toHaveValue('');
  });

  it('submits form successfully with valid data', async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      success: true,
      data: {
        requestId: 'request-123',
        status: 'pending',
        message: 'Request submitted successfully',
      },
    });

    render(<TenantRequestForm {...defaultProps} />);

    const emailInput = screen.getByLabelText(/tenant email/i);
    const pinInput = screen.getByLabelText(/tenant pin/i);
    const submitButton = screen.getByRole('button', { name: /send for review/i });

    fireEvent.change(emailInput, { target: { value: 'tenant@starbucks.com' } });
    fireEvent.change(pinInput, { target: { value: '123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/api/broker/tenants/tenant-123/request',
        {
          tenant_email: 'tenant@starbucks.com',
          tenant_pin: '123',
        }
      );
    });

    expect(screen.getByText(/request submitted successfully/i)).toBeInTheDocument();
    expect(mockOnRequestSubmit).toHaveBeenCalledWith({
      email: 'tenant@starbucks.com',
      pin: '123',
    });
  });

  it('displays error message on submission failure', async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      success: false,
      error: 'Invalid PIN',
    });

    render(<TenantRequestForm {...defaultProps} />);

    const emailInput = screen.getByLabelText(/tenant email/i);
    const pinInput = screen.getByLabelText(/tenant pin/i);
    const submitButton = screen.getByRole('button', { name: /send for review/i });

    fireEvent.change(emailInput, { target: { value: 'tenant@starbucks.com' } });
    fireEvent.change(pinInput, { target: { value: '123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid pin/i)).toBeInTheDocument();
    });
  });

  it('disables form during submission', async () => {
    mockedApiClient.post.mockImplementation(() => new Promise(() => {}));

    render(<TenantRequestForm {...defaultProps} />);

    const emailInput = screen.getByLabelText(/tenant email/i);
    const pinInput = screen.getByLabelText(/tenant pin/i);
    const submitButton = screen.getByRole('button', { name: /send for review/i });

    fireEvent.change(emailInput, { target: { value: 'tenant@starbucks.com' } });
    fireEvent.change(pinInput, { target: { value: '123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(emailInput).toBeDisabled();
      expect(pinInput).toBeDisabled();
    });
  });
});
