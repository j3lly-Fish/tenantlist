import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LocationMapSelector } from '@components/broker/LocationMapSelector';

describe('LocationMapSelector', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render map container', () => {
      render(<LocationMapSelector boundaries={null} onChange={mockOnChange} />);

      expect(screen.getByText('Interactive Map')).toBeInTheDocument();
    });

    it('should render search input', () => {
      render(<LocationMapSelector boundaries={null} onChange={mockOnChange} />);

      expect(screen.getByPlaceholderText('Search by city')).toBeInTheDocument();
    });

    it('should render drawing mode buttons', () => {
      render(<LocationMapSelector boundaries={null} onChange={mockOnChange} />);

      expect(screen.getByRole('button', { name: /Market/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reduce/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Draw/i })).toBeInTheDocument();
    });

    it('should render map placeholder with hint text', () => {
      render(<LocationMapSelector boundaries={null} onChange={mockOnChange} />);

      expect(
        screen.getByText(/Select a drawing mode above to mark areas of interest/i)
      ).toBeInTheDocument();
    });
  });

  describe('Drawing Mode Selection', () => {
    it('should toggle market mode on button click', () => {
      render(<LocationMapSelector boundaries={null} onChange={mockOnChange} />);

      const marketButton = screen.getByRole('button', { name: /Market/i });
      fireEvent.click(marketButton);

      expect(screen.getByText(/Market mode active/i)).toBeInTheDocument();
    });

    it('should toggle reduce mode on button click', () => {
      render(<LocationMapSelector boundaries={null} onChange={mockOnChange} />);

      const reduceButton = screen.getByRole('button', { name: /Reduce/i });
      fireEvent.click(reduceButton);

      expect(screen.getByText(/Reduce mode active/i)).toBeInTheDocument();
    });

    it('should toggle draw mode on button click', () => {
      render(<LocationMapSelector boundaries={null} onChange={mockOnChange} />);

      const drawButton = screen.getByRole('button', { name: /Draw/i });
      fireEvent.click(drawButton);

      expect(screen.getByText(/Draw mode active/i)).toBeInTheDocument();
    });

    it('should deactivate mode when clicked again', () => {
      render(<LocationMapSelector boundaries={null} onChange={mockOnChange} />);

      const marketButton = screen.getByRole('button', { name: /Market/i });
      fireEvent.click(marketButton);
      fireEvent.click(marketButton);

      expect(
        screen.getByText(/Select a drawing mode above to mark areas of interest/i)
      ).toBeInTheDocument();
    });

    it('should switch between modes', () => {
      render(<LocationMapSelector boundaries={null} onChange={mockOnChange} />);

      fireEvent.click(screen.getByRole('button', { name: /Market/i }));
      expect(screen.getByText(/Market mode active/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Draw/i }));
      expect(screen.getByText(/Draw mode active/i)).toBeInTheDocument();
    });
  });

  describe('City Search', () => {
    it('should update search input value', () => {
      render(<LocationMapSelector boundaries={null} onChange={mockOnChange} />);

      const searchInput = screen.getByPlaceholderText('Search by city') as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'San Francisco' } });

      expect(searchInput.value).toBe('San Francisco');
    });

    it('should add city to selected areas on search', () => {
      render(<LocationMapSelector boundaries={null} onChange={mockOnChange} />);

      const searchInput = screen.getByPlaceholderText('Search by city');
      const searchButton = screen.getByRole('button', { name: /Search/i });

      fireEvent.change(searchInput, { target: { value: 'Palo Alto' } });
      fireEvent.click(searchButton);

      expect(screen.getByText('Palo Alto')).toBeInTheDocument();
      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should clear search input after adding city', () => {
      render(<LocationMapSelector boundaries={null} onChange={mockOnChange} />);

      const searchInput = screen.getByPlaceholderText('Search by city') as HTMLInputElement;
      const searchButton = screen.getByRole('button', { name: /Search/i });

      fireEvent.change(searchInput, { target: { value: 'Oakland' } });
      fireEvent.click(searchButton);

      expect(searchInput.value).toBe('');
    });

    it('should not add empty city', () => {
      render(<LocationMapSelector boundaries={null} onChange={mockOnChange} />);

      const searchInput = screen.getByPlaceholderText('Search by city');
      const searchButton = screen.getByRole('button', { name: /Search/i });

      fireEvent.change(searchInput, { target: { value: '   ' } });
      fireEvent.click(searchButton);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should not add duplicate cities', () => {
      render(<LocationMapSelector boundaries={null} onChange={mockOnChange} />);

      const searchInput = screen.getByPlaceholderText('Search by city');
      const searchButton = screen.getByRole('button', { name: /Search/i });

      // Add city first time
      fireEvent.change(searchInput, { target: { value: 'Berkeley' } });
      fireEvent.click(searchButton);

      // Try to add same city again
      fireEvent.change(searchInput, { target: { value: 'Berkeley' } });
      fireEvent.click(searchButton);

      // Should only call onChange once
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it('should submit form on Enter key', () => {
      render(<LocationMapSelector boundaries={null} onChange={mockOnChange} />);

      const searchInput = screen.getByPlaceholderText('Search by city');

      fireEvent.change(searchInput, { target: { value: 'Los Altos' } });
      fireEvent.submit(searchInput.closest('form')!);

      expect(screen.getByText('Los Altos')).toBeInTheDocument();
    });
  });

  describe('Selected Areas Management', () => {
    it('should display selected areas list', () => {
      render(<LocationMapSelector boundaries={null} onChange={mockOnChange} />);

      const searchInput = screen.getByPlaceholderText('Search by city');
      const searchButton = screen.getByRole('button', { name: /Search/i });

      fireEvent.change(searchInput, { target: { value: 'Menlo Park' } });
      fireEvent.click(searchButton);

      expect(screen.getByText('Selected Areas:')).toBeInTheDocument();
      expect(screen.getByText('Menlo Park')).toBeInTheDocument();
    });

    it('should remove area when X button is clicked', () => {
      render(<LocationMapSelector boundaries={null} onChange={mockOnChange} />);

      const searchInput = screen.getByPlaceholderText('Search by city');
      const searchButton = screen.getByRole('button', { name: /Search/i });

      // Add an area
      fireEvent.change(searchInput, { target: { value: 'Atherton' } });
      fireEvent.click(searchButton);

      // Remove it
      const removeButton = screen.getByRole('button', { name: /Remove Atherton/i });
      fireEvent.click(removeButton);

      expect(screen.queryByText('Atherton')).not.toBeInTheDocument();
      expect(mockOnChange).toHaveBeenCalledWith(null);
    });

    it('should handle multiple selected areas', () => {
      render(<LocationMapSelector boundaries={null} onChange={mockOnChange} />);

      const searchInput = screen.getByPlaceholderText('Search by city');
      const searchButton = screen.getByRole('button', { name: /Search/i });

      const cities = ['Palo Alto', 'Los Altos', 'Menlo Park'];
      cities.forEach((city) => {
        fireEvent.change(searchInput, { target: { value: city } });
        fireEvent.click(searchButton);
      });

      cities.forEach((city) => {
        expect(screen.getByText(city)).toBeInTheDocument();
      });
    });
  });

  describe('GeoJSON Generation', () => {
    it('should call onChange with GeoJSON when area is added', () => {
      render(<LocationMapSelector boundaries={null} onChange={mockOnChange} />);

      const searchInput = screen.getByPlaceholderText('Search by city');
      const searchButton = screen.getByRole('button', { name: /Search/i });

      fireEvent.change(searchInput, { target: { value: 'San Jose' } });
      fireEvent.click(searchButton);

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'FeatureCollection',
          features: expect.any(Array),
        })
      );
    });

    it('should call onChange with null when all areas are removed', () => {
      render(<LocationMapSelector boundaries={null} onChange={mockOnChange} />);

      const searchInput = screen.getByPlaceholderText('Search by city');
      const searchButton = screen.getByRole('button', { name: /Search/i });

      // Add area
      fireEvent.change(searchInput, { target: { value: 'Fremont' } });
      fireEvent.click(searchButton);

      // Remove area
      const removeButton = screen.getByRole('button', { name: /Remove Fremont/i });
      fireEvent.click(removeButton);

      expect(mockOnChange).toHaveBeenLastCalledWith(null);
    });
  });

  describe('Accessibility', () => {
    it('should have proper titles for mode buttons', () => {
      render(<LocationMapSelector boundaries={null} onChange={mockOnChange} />);

      const marketButton = screen.getByRole('button', { name: /Market/i });
      expect(marketButton).toHaveAttribute('title', 'Market mode');
    });

    it('should have proper aria-label for remove buttons', () => {
      render(<LocationMapSelector boundaries={null} onChange={mockOnChange} />);

      const searchInput = screen.getByPlaceholderText('Search by city');
      const searchButton = screen.getByRole('button', { name: /Search/i });

      fireEvent.change(searchInput, { target: { value: 'Cupertino' } });
      fireEvent.click(searchButton);

      expect(screen.getByRole('button', { name: /Remove Cupertino/i })).toBeInTheDocument();
    });
  });
});
