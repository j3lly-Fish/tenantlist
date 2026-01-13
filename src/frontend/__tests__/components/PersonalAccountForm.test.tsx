import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PersonalAccountForm } from '../../components/PersonalAccountForm';

// Mock fetch
global.fetch = jest.fn();

describe('PersonalAccountForm', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('6.1: Form display and structure', () => {
    it('should display form when isOpen is true', () => {
      render(
        <PersonalAccountForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText('Create Your Personal Account')).toBeInTheDocument();
      expect(
        screen.getByText('Create your personal profile, you will then be able to create your business profile')
      ).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(
        <PersonalAccountForm
          isOpen={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.queryByText('Create Your Personal Account')).not.toBeInTheDocument();
    });

    it('should display all required form fields', () => {
      render(
        <PersonalAccountForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByText('Upload Profile Image')).toBeInTheDocument();
    });

    it('should display submit button with correct text', () => {
      render(
        <PersonalAccountForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const submitButton = screen.getByRole('button', { name: /create personal account/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('6.2: Required field validations', () => {
    it('should show error when first name is empty on submit', async () => {
      render(
        <PersonalAccountForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const submitButton = screen.getByRole('button', { name: /create personal account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('First name is required')).toBeInTheDocument();
      });
    });

    it('should show error when last name is empty on submit', async () => {
      render(
        <PersonalAccountForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const submitButton = screen.getByRole('button', { name: /create personal account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Last name is required')).toBeInTheDocument();
      });
    });

    it('should show error when company name is empty on submit', async () => {
      render(
        <PersonalAccountForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const submitButton = screen.getByRole('button', { name: /create personal account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Company name is required')).toBeInTheDocument();
      });
    });

    it('should show error when phone number is empty on submit', async () => {
      render(
        <PersonalAccountForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const submitButton = screen.getByRole('button', { name: /create personal account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Phone number is required')).toBeInTheDocument();
      });
    });

    it('should show error when email is empty on submit', async () => {
      render(
        <PersonalAccountForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const submitButton = screen.getByRole('button', { name: /create personal account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      jest.useFakeTimers();

      // Mock fetch to return empty results for company name autocomplete
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ businesses: [] }),
      });

      render(
        <PersonalAccountForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Fill in all fields except email with valid data
      fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByLabelText(/company name/i), { target: { value: 'Test Company' } });

      // Allow debounce to complete
      act(() => {
        jest.advanceTimersByTime(300);
      });

      fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '1234567890' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'invalid-email' } });

      const submitButton = screen.getByRole('button', { name: /create personal account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email')).toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });

  describe('6.3: Profile picture upload functionality', () => {
    it('should accept valid image file types (JPG, PNG, GIF)', async () => {
      render(
        <PersonalAccountForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onload: null as any,
        result: 'data:image/jpeg;base64,dummydata',
      };

      global.FileReader = jest.fn(() => mockFileReader) as any;

      fireEvent.change(input, { target: { files: [file] } });

      // Trigger the onload callback
      if (mockFileReader.readAsDataURL.mock.calls.length > 0) {
        mockFileReader.onload({ target: mockFileReader } as any);
      }

      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(file);
    });

    it('should reject invalid file types', async () => {
      render(
        <PersonalAccountForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('Please upload a JPG, PNG, or GIF file')).toBeInTheDocument();
      });
    });

    it('should reject files larger than 10MB', async () => {
      render(
        <PersonalAccountForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Create a file larger than 10MB
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 });

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [largeFile] } });

      await waitFor(() => {
        expect(screen.getByText('Image must be less than 10 MB')).toBeInTheDocument();
      });
    });
  });

  describe('6.4: Company name autocomplete with duplicate check', () => {
    it('should trigger company search with 300ms debounce', async () => {
      jest.useFakeTimers();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          businesses: [
            { id: '1', name: 'Test Company' },
            { id: '2', name: 'Test Corp' },
          ],
        }),
      });

      render(
        <PersonalAccountForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const companyInput = screen.getByLabelText(/company name/i);
      fireEvent.change(companyInput, { target: { value: 'Test' } });

      // Should not call immediately
      expect(global.fetch).not.toHaveBeenCalled();

      // Fast-forward time by 300ms
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/businesses/search?query=Test'),
          expect.any(Object)
        );
      });

      jest.useRealTimers();
    });

    it('should display autocomplete suggestions', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          businesses: [
            { id: '1', name: 'Acme Corporation' },
            { id: '2', name: 'Acme Industries' },
          ],
        }),
      });

      render(
        <PersonalAccountForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const companyInput = screen.getByLabelText(/company name/i);
      fireEvent.change(companyInput, { target: { value: 'Acme' } });

      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
        expect(screen.getByText('Acme Industries')).toBeInTheDocument();
      });
    });

    it('should warn user when selecting existing company from suggestions', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          businesses: [
            { id: '1', name: 'Existing Company' },
          ],
        }),
      });

      render(
        <PersonalAccountForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const companyInput = screen.getByLabelText(/company name/i);
      fireEvent.change(companyInput, { target: { value: 'Existing' } });

      await waitFor(() => {
        expect(screen.getByText('Existing Company')).toBeInTheDocument();
      });

      const suggestionButton = screen.getByText('Existing Company');
      fireEvent.mouseDown(suggestionButton);

      await waitFor(() => {
        expect(screen.getByText(/this company already exists/i)).toBeInTheDocument();
      });
    });
  });

  describe('6.5: Pre-submission duplicate check', () => {
    it('should check for duplicate before submitting form', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ exists: false }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { business: { id: 'biz-1' } } }),
        });

      render(
        <PersonalAccountForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Fill out form
      fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByLabelText(/company name/i), { target: { value: 'New Company' } });
      fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '1234567890' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });

      const submitButton = screen.getByRole('button', { name: /create personal account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/businesses/check-duplicate',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ companyName: 'New Company' }),
          })
        );
      });
    });

    it('should show error and prevent submission if duplicate exists', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          exists: true,
          business: { id: '1', name: 'Existing Company' },
        }),
      });

      render(
        <PersonalAccountForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Fill out form
      fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByLabelText(/company name/i), { target: { value: 'Existing Company' } });
      fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '1234567890' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });

      const submitButton = screen.getByRole('button', { name: /create personal account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/this business already exists.*please search for and select the existing business/i)
        ).toBeInTheDocument();
      });

      // Should not call user profile or business creation endpoints
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  describe('6.6: Form submission success flow', () => {
    it('should successfully create personal account and business profile', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ exists: false }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: { user: { id: 'user-1' } } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { business: { id: 'biz-1', name: 'New Company' } },
          }),
        });

      render(
        <PersonalAccountForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Fill out form
      fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByLabelText(/company name/i), { target: { value: 'New Company' } });
      fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '1234567890' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });

      const submitButton = screen.getByRole('button', { name: /create personal account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });

      // Verify all API calls were made
      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        '/api/businesses/check-duplicate',
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        '/api/user/profile',
        expect.objectContaining({ method: 'PUT' })
      );
      expect(global.fetch).toHaveBeenNthCalledWith(
        3,
        '/api/businesses',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should disable submit button while loading', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100))
      );

      render(
        <PersonalAccountForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Fill out form
      fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByLabelText(/company name/i), { target: { value: 'Test Company' } });
      fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '1234567890' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });

      const submitButton = screen.getByRole('button', { name: /create personal account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
        expect(submitButton).toHaveTextContent('Creating...');
      });
    });
  });

  describe('6.7: Modal interactions', () => {
    it('should call onClose when close button is clicked', () => {
      render(
        <PersonalAccountForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const closeButton = screen.getByLabelText(/close modal/i);
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should close modal on Escape key press', () => {
      render(
        <PersonalAccountForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const modal = screen.getByRole('dialog');
      fireEvent.keyDown(modal.parentElement!, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should pre-fill company name from initialCompanyName prop', () => {
      render(
        <PersonalAccountForm
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          initialCompanyName="Pre-filled Company"
        />
      );

      const companyInput = screen.getByLabelText(/company name/i) as HTMLInputElement;
      expect(companyInput.value).toBe('Pre-filled Company');
    });
  });
});
