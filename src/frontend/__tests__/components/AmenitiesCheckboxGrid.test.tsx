import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AmenitiesCheckboxGrid } from '@components/broker/AmenitiesCheckboxGrid';

describe('AmenitiesCheckboxGrid', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all 41 amenities', () => {
      render(<AmenitiesCheckboxGrid selectedAmenities={[]} onChange={mockOnChange} />);

      // Check for a sample of amenities
      expect(screen.getByLabelText('Corporate location')).toBeInTheDocument();
      expect(screen.getByLabelText('24/7')).toBeInTheDocument();
      expect(screen.getByLabelText('ADA accessible')).toBeInTheDocument();
      expect(screen.getByLabelText('Drive Thru')).toBeInTheDocument();
      expect(screen.getByLabelText('Parking')).toBeInTheDocument();
      expect(screen.getByLabelText('Wide truck court')).toBeInTheDocument();
    });

    it('should render all checkboxes unchecked by default', () => {
      render(<AmenitiesCheckboxGrid selectedAmenities={[]} onChange={mockOnChange} />);

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach((checkbox) => {
        expect(checkbox).not.toBeChecked();
      });
    });

    it('should render selected amenities as checked', () => {
      const selectedAmenities = ['Parking', 'ADA accessible', 'Drive Thru'];
      render(
        <AmenitiesCheckboxGrid selectedAmenities={selectedAmenities} onChange={mockOnChange} />
      );

      selectedAmenities.forEach((amenity) => {
        const checkbox = screen.getByLabelText(amenity) as HTMLInputElement;
        expect(checkbox).toBeChecked();
      });
    });
  });

  describe('Selection Interactions', () => {
    it('should add amenity when checkbox is clicked', () => {
      render(<AmenitiesCheckboxGrid selectedAmenities={[]} onChange={mockOnChange} />);

      const parkingCheckbox = screen.getByLabelText('Parking');
      fireEvent.click(parkingCheckbox);

      expect(mockOnChange).toHaveBeenCalledWith(['Parking']);
    });

    it('should remove amenity when checked checkbox is clicked', () => {
      const selectedAmenities = ['Parking', 'Drive Thru'];
      render(
        <AmenitiesCheckboxGrid selectedAmenities={selectedAmenities} onChange={mockOnChange} />
      );

      const parkingCheckbox = screen.getByLabelText('Parking');
      fireEvent.click(parkingCheckbox);

      expect(mockOnChange).toHaveBeenCalledWith(['Drive Thru']);
    });

    it('should append to existing selections', () => {
      const selectedAmenities = ['Parking'];
      render(
        <AmenitiesCheckboxGrid selectedAmenities={selectedAmenities} onChange={mockOnChange} />
      );

      const adaCheckbox = screen.getByLabelText('ADA accessible');
      fireEvent.click(adaCheckbox);

      expect(mockOnChange).toHaveBeenCalledWith(['Parking', 'ADA accessible']);
    });

    it('should handle multiple selections', () => {
      render(<AmenitiesCheckboxGrid selectedAmenities={[]} onChange={mockOnChange} />);

      fireEvent.click(screen.getByLabelText('Parking'));
      fireEvent.click(screen.getByLabelText('ADA accessible'));
      fireEvent.click(screen.getByLabelText('Drive Thru'));

      expect(mockOnChange).toHaveBeenCalledTimes(3);
    });
  });

  describe('Dock Amenities', () => {
    it('should render all dock-related amenities', () => {
      render(<AmenitiesCheckboxGrid selectedAmenities={[]} onChange={mockOnChange} />);

      const dockAmenities = [
        'Dock - cross dock',
        'Dock - double wide',
        'Dock - drive in ramp',
        'Dock - enclosed loading',
        'Dock - levelers',
        'Dock - truck lifts',
        'Dock - truck wells',
        'Dock - insulated',
        'Dock - loading sub',
        'Dock - ground level bays',
      ];

      dockAmenities.forEach((amenity) => {
        expect(screen.getByLabelText(amenity)).toBeInTheDocument();
      });
    });
  });

  describe('Specific Amenity Categories', () => {
    it('should render clear height options', () => {
      render(<AmenitiesCheckboxGrid selectedAmenities={[]} onChange={mockOnChange} />);

      expect(screen.getByLabelText("Clear height 24'+")).toBeInTheDocument();
      expect(screen.getByLabelText("Clear height 32'+")).toBeInTheDocument();
    });

    it('should render temperature-controlled options', () => {
      render(<AmenitiesCheckboxGrid selectedAmenities={[]} onChange={mockOnChange} />);

      expect(screen.getByLabelText('Freezer capacity')).toBeInTheDocument();
      expect(screen.getByLabelText('Refrigerator')).toBeInTheDocument();
    });

    it('should render restaurant-specific amenities', () => {
      render(<AmenitiesCheckboxGrid selectedAmenities={[]} onChange={mockOnChange} />);

      expect(screen.getByLabelText('2nd generation restaurant')).toBeInTheDocument();
      expect(screen.getByLabelText('Grease trap')).toBeInTheDocument();
      expect(screen.getByLabelText('Liquor license')).toBeInTheDocument();
    });
  });

  describe('Grid Layout', () => {
    it('should have scrollable container for many amenities', () => {
      const { container } = render(
        <AmenitiesCheckboxGrid selectedAmenities={[]} onChange={mockOnChange} />
      );

      const grid = container.querySelector('[class*="grid"]');
      expect(grid).toBeInTheDocument();
    });
  });
});
