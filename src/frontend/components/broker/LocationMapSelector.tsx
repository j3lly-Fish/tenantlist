import React, { useState } from 'react';
import styles from './LocationMapSelector.module.css';

interface LocationMapSelectorProps {
  boundaries: any | null;
  onChange: (boundaries: any) => void;
}

type DrawMode = 'market' | 'reduce' | 'draw' | null;

export const LocationMapSelector: React.FC<LocationMapSelectorProps> = ({
  boundaries,
  onChange,
}) => {
  const [drawMode, setDrawMode] = useState<DrawMode>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

  const handleModeChange = (mode: DrawMode) => {
    setDrawMode(drawMode === mode ? null : mode);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // In a real implementation, this would search for the city and center the map
      // For now, we'll just add it to selected areas
      if (!selectedAreas.includes(searchQuery.trim())) {
        const newAreas = [...selectedAreas, searchQuery.trim()];
        setSelectedAreas(newAreas);

        // Update boundaries with selected areas
        onChange({
          type: 'FeatureCollection',
          features: newAreas.map((area) => ({
            type: 'Feature',
            properties: { name: area },
            geometry: {
              type: 'Point',
              coordinates: [0, 0], // Placeholder coordinates
            },
          })),
        });
      }
      setSearchQuery('');
    }
  };

  const handleRemoveArea = (index: number) => {
    const newAreas = selectedAreas.filter((_, i) => i !== index);
    setSelectedAreas(newAreas);

    // Update boundaries
    if (newAreas.length === 0) {
      onChange(null);
    } else {
      onChange({
        type: 'FeatureCollection',
        features: newAreas.map((area) => ({
          type: 'Feature',
          properties: { name: area },
          geometry: {
            type: 'Point',
            coordinates: [0, 0],
          },
        })),
      });
    }
  };

  return (
    <div className={styles.container}>
      {/* Search Bar */}
      <form onSubmit={handleSearch} className={styles.searchBar}>
        <input
          type="text"
          className={styles.searchInput}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by city"
        />
        <button type="submit" className={styles.searchButton}>
          Search
        </button>
      </form>

      {/* Drawing Tools */}
      <div className={styles.toolbar}>
        <button
          type="button"
          className={`${styles.toolButton} ${drawMode === 'market' ? styles.toolButtonActive : ''}`}
          onClick={() => handleModeChange('market')}
          title="Market mode"
        >
          Market
        </button>
        <button
          type="button"
          className={`${styles.toolButton} ${drawMode === 'reduce' ? styles.toolButtonActive : ''}`}
          onClick={() => handleModeChange('reduce')}
          title="Reduce mode"
        >
          Reduce
        </button>
        <button
          type="button"
          className={`${styles.toolButton} ${drawMode === 'draw' ? styles.toolButtonActive : ''}`}
          onClick={() => handleModeChange('draw')}
          title="Draw mode"
        >
          Draw
        </button>
      </div>

      {/* Map Container (Placeholder) */}
      <div className={styles.mapContainer}>
        <div className={styles.mapPlaceholder}>
          <div className={styles.mapIcon}>🗺️</div>
          <p className={styles.mapText}>Interactive Map</p>
          <p className={styles.mapHint}>
            {drawMode
              ? `${drawMode.charAt(0).toUpperCase() + drawMode.slice(1)} mode active - Click to draw on map`
              : 'Select a drawing mode above to mark areas of interest'}
          </p>
          {selectedAreas.length > 0 && (
            <div className={styles.selectedAreas}>
              <p className={styles.selectedAreasTitle}>Selected Areas:</p>
              <div className={styles.areasList}>
                {selectedAreas.map((area, index) => (
                  <div key={index} className={styles.areaTag}>
                    <span>{area}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveArea(index)}
                      className={styles.areaRemoveButton}
                      aria-label={`Remove ${area}`}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <p className={styles.note}>
        Note: Map integration with Google Maps or Mapbox can be added here. Drawn boundaries will be
        saved as GeoJSON format.
      </p>
    </div>
  );
};
