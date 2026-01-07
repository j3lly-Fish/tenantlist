import React, { useState, KeyboardEvent } from 'react';
import styles from './LocationTagInput.module.css';

interface LocationTagInputProps {
  locations: string[];
  onChange: (locations: string[]) => void;
}

export const LocationTagInput: React.FC<LocationTagInputProps> = ({ locations, onChange }) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const newLocation = inputValue.trim();

      // Prevent duplicates
      if (!locations.includes(newLocation)) {
        onChange([...locations, newLocation]);
      }

      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && locations.length > 0) {
      // Remove last location when backspace is pressed on empty input
      const newLocations = [...locations];
      newLocations.pop();
      onChange(newLocations);
    }
  };

  const handleRemoveLocation = (index: number) => {
    const newLocations = locations.filter((_, i) => i !== index);
    onChange(newLocations);
  };

  return (
    <div className={styles.container}>
      <div className={styles.tagsContainer}>
        {locations.map((location, index) => (
          <div key={index} className={styles.tag}>
            <span className={styles.tagText}>{location}</span>
            <button
              type="button"
              className={styles.removeButton}
              onClick={() => handleRemoveLocation(index)}
              aria-label={`Remove ${location}`}
            >
              &times;
            </button>
          </div>
        ))}
        <input
          type="text"
          className={styles.input}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={locations.length === 0 ? 'Type location and press Enter' : ''}
        />
      </div>
      {locations.length === 0 && (
        <p className={styles.hint}>
          Enter city names (e.g., "Palo Alto", "Los Altos Hills") and press Enter to add
        </p>
      )}
    </div>
  );
};
