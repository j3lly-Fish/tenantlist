import React from 'react';
import styles from './AmenitiesCheckboxGrid.module.css';

interface AmenitiesCheckboxGridProps {
  selectedAmenities: string[];
  onChange: (amenities: string[]) => void;
}

// 40+ amenities as specified in the requirements
const AMENITIES = [
  'Corporate location',
  '24/7',
  '2nd generation restaurant',
  '3 phase electrical',
  'ADA accessible',
  'Anchor tenants',
  'Asphalt/concrete ground',
  'Clear height 24\'+',
  'Clear height 32\'+',
  'Conference room',
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
  'Drive Thru',
  'End cap',
  'ESFR',
  'Fencing & secure',
  'Freezer capacity',
  'Refrigerator',
  'Glass store front',
  'Grease trap',
  'Hotel lobby',
  'Inline',
  'Liquor license',
  'On site amenities',
  'Out parcel',
  'Parking',
  'Patio/outdoor seating',
  'Private suites',
  'Proximity to seaport/airport',
  'Public transportation',
  'Rail access',
  'Signage',
  'Wide truck court',
];

export const AmenitiesCheckboxGrid: React.FC<AmenitiesCheckboxGridProps> = ({
  selectedAmenities,
  onChange,
}) => {
  const handleToggle = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      onChange(selectedAmenities.filter((a) => a !== amenity));
    } else {
      onChange([...selectedAmenities, amenity]);
    }
  };

  return (
    <div className={styles.grid}>
      {AMENITIES.map((amenity) => (
        <label key={amenity} className={styles.checkboxLabel}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={selectedAmenities.includes(amenity)}
            onChange={() => handleToggle(amenity)}
          />
          <span className={styles.checkboxText}>{amenity}</span>
        </label>
      ))}
    </div>
  );
};
