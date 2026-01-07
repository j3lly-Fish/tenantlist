import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LocationTagInput } from '@components/broker/LocationTagInput';

describe('LocationTagInput', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render input field', () => {
      render(<LocationTagInput locations={[]} onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText(/Type location and press Enter/i);
      expect(input).toBeInTheDocument();
    });

    it('should render hint text when no locations', () => {
      render(<LocationTagInput locations={[]} onChange={mockOnChange} />);

      expect(screen.getByText(/Enter city names/i)).toBeInTheDocument();
    });

    it('should not render hint text when locations exist', () => {
      render(<LocationTagInput locations={['Palo Alto']} onChange={mockOnChange} />);

      expect(screen.queryByText(/Enter city names/i)).not.toBeInTheDocument();
    });

    it('should render location tags', () => {
      const locations = ['Palo Alto', 'Los Altos', 'Menlo Park'];
      render(<LocationTagInput locations={locations} onChange={mockOnChange} />);

      locations.forEach((location) => {
        expect(screen.getByText(location)).toBeInTheDocument();
      });
    });
  });

  describe('Adding Locations', () => {
    it('should add location when Enter is pressed', () => {
      render(<LocationTagInput locations={[]} onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText(/Type location and press Enter/i);
      fireEvent.change(input, { target: { value: 'San Francisco' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(mockOnChange).toHaveBeenCalledWith(['San Francisco']);
    });

    it('should trim whitespace before adding', () => {
      render(<LocationTagInput locations={[]} onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText(/Type location and press Enter/i);
      fireEvent.change(input, { target: { value: '  Oakland  ' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(mockOnChange).toHaveBeenCalledWith(['Oakland']);
    });

    it('should not add empty location', () => {
      render(<LocationTagInput locations={[]} onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText(/Type location and press Enter/i);
      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should not add duplicate locations', () => {
      const existingLocations = ['Palo Alto'];
      render(<LocationTagInput locations={existingLocations} onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'Palo Alto' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should clear input after adding location', () => {
      render(<LocationTagInput locations={[]} onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText(
        /Type location and press Enter/i
      ) as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'Berkeley' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(input.value).toBe('');
    });

    it('should append to existing locations', () => {
      const existingLocations = ['Palo Alto', 'Los Altos'];
      render(<LocationTagInput locations={existingLocations} onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'Menlo Park' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(mockOnChange).toHaveBeenCalledWith(['Palo Alto', 'Los Altos', 'Menlo Park']);
    });
  });

  describe('Removing Locations', () => {
    it('should remove location when X button is clicked', () => {
      const locations = ['Palo Alto', 'Los Altos', 'Menlo Park'];
      render(<LocationTagInput locations={locations} onChange={mockOnChange} />);

      const removeButtons = screen.getAllByRole('button', { name: /Remove/i });
      fireEvent.click(removeButtons[1]); // Remove "Los Altos"

      expect(mockOnChange).toHaveBeenCalledWith(['Palo Alto', 'Menlo Park']);
    });

    it('should remove last location when backspace is pressed on empty input', () => {
      const locations = ['Palo Alto', 'Los Altos'];
      render(<LocationTagInput locations={locations} onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.keyDown(input, { key: 'Backspace', code: 'Backspace' });

      expect(mockOnChange).toHaveBeenCalledWith(['Palo Alto']);
    });

    it('should not remove location when backspace is pressed on non-empty input', () => {
      const locations = ['Palo Alto'];
      render(<LocationTagInput locations={locations} onChange={mockOnChange} />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.keyDown(input, { key: 'Backspace', code: 'Backspace' });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should not remove location when no locations exist', () => {
      render(<LocationTagInput locations={[]} onChange={mockOnChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.keyDown(input, { key: 'Backspace', code: 'Backspace' });

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label on remove buttons', () => {
      const locations = ['Palo Alto', 'Los Altos'];
      render(<LocationTagInput locations={locations} onChange={mockOnChange} />);

      expect(screen.getByRole('button', { name: 'Remove Palo Alto' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Remove Los Altos' })).toBeInTheDocument();
    });
  });
});
