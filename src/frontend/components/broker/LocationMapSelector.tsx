import React, { useState, useCallback, useRef } from 'react';
import { GoogleMap, DrawingManager, Polygon } from '@react-google-maps/api';
import { useGoogleMaps } from '../../contexts/GoogleMapsProvider';
import styles from './LocationMapSelector.module.css';

interface LocationMapSelectorProps {
  boundaries: any | null;
  onChange: (boundaries: any) => void;
}

type DrawMode = 'market' | 'reduce' | 'draw' | null;

const defaultCenter = {
  lat: 39.8283, // Center of USA
  lng: -98.5795,
};

const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

export const LocationMapSelector: React.FC<LocationMapSelectorProps> = ({
  boundaries,
  onChange,
}) => {
  const [drawMode, setDrawMode] = useState<DrawMode>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [drawnPolygons, setDrawnPolygons] = useState<google.maps.Polygon[]>([]);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { isLoaded, loadError } = useGoogleMaps();

  const handleModeChange = (mode: DrawMode) => {
    const newMode = drawMode === mode ? null : mode;
    setDrawMode(newMode);
  };

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);

    // Initialize autocomplete for search
    if (searchInputRef.current && window.google) {
      const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
        types: ['(cities)'],
        componentRestrictions: { country: 'us' },
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry && place.geometry.location) {
          map.panTo(place.geometry.location);
          map.setZoom(11);

          // Add city to selected areas
          const cityName = place.name || '';
          if (cityName && !selectedAreas.includes(cityName)) {
            const newAreas = [...selectedAreas, cityName];
            setSelectedAreas(newAreas);
            updateBoundaries(newAreas, drawnPolygons);
          }
        }
      });

      autocompleteRef.current = autocomplete;
    }
  }, [selectedAreas, drawnPolygons]);

  const onPolygonComplete = useCallback((polygon: google.maps.Polygon) => {
    const newPolygons = [...drawnPolygons, polygon];
    setDrawnPolygons(newPolygons);
    updateBoundaries(selectedAreas, newPolygons);

    // Add click listener to polygon for deletion
    polygon.addListener('click', () => {
      polygon.setMap(null);
      const filteredPolygons = newPolygons.filter(p => p !== polygon);
      setDrawnPolygons(filteredPolygons);
      updateBoundaries(selectedAreas, filteredPolygons);
    });
  }, [drawnPolygons, selectedAreas]);

  const updateBoundaries = (areas: string[], polygons: google.maps.Polygon[]) => {
    const features: any[] = [];

    // Add city areas as points
    areas.forEach((area) => {
      features.push({
        type: 'Feature',
        properties: { name: area, type: 'city' },
        geometry: {
          type: 'Point',
          coordinates: [0, 0], // Coordinates would be set by geocoding
        },
      });
    });

    // Add drawn polygons
    polygons.forEach((polygon, index) => {
      const path = polygon.getPath();
      const coordinates: [number, number][] = [];

      for (let i = 0; i < path.getLength(); i++) {
        const point = path.getAt(i);
        coordinates.push([point.lng(), point.lat()]);
      }

      // Close the polygon
      if (coordinates.length > 0) {
        coordinates.push(coordinates[0]);
      }

      features.push({
        type: 'Feature',
        properties: { name: `Polygon ${index + 1}`, type: 'polygon' },
        geometry: {
          type: 'Polygon',
          coordinates: [coordinates],
        },
      });
    });

    if (features.length === 0) {
      onChange(null);
    } else {
      onChange({
        type: 'FeatureCollection',
        features,
      });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Autocomplete handles the search
  };

  const handleRemoveArea = (index: number) => {
    const newAreas = selectedAreas.filter((_, i) => i !== index);
    setSelectedAreas(newAreas);
    updateBoundaries(newAreas, drawnPolygons);
  };

  const handleClearAll = () => {
    // Remove all polygons from map
    drawnPolygons.forEach(polygon => polygon.setMap(null));
    setDrawnPolygons([]);
    setSelectedAreas([]);
    onChange(null);
  };

  if (loadError) {
    return (
      <div className={styles.container}>
        <div className={styles.mapContainer}>
          <div className={styles.mapPlaceholder}>
            <p className={styles.mapText}>Failed to load map</p>
            <p className={styles.mapHint}>Please check your internet connection</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={styles.container}>
        <div className={styles.mapContainer}>
          <div className={styles.mapPlaceholder}>
            <div className={styles.mapIcon}>🗺️</div>
            <p className={styles.mapText}>Loading map...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Search Bar */}
      <form onSubmit={handleSearch} className={styles.searchBar}>
        <input
          ref={searchInputRef}
          type="text"
          className={styles.searchInput}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by city"
        />
      </form>

      {/* Drawing Tools */}
      <div className={styles.toolbar}>
        <button
          type="button"
          className={`${styles.toolButton} ${drawMode === 'market' ? styles.toolButtonActive : ''}`}
          onClick={() => handleModeChange('market')}
          title="Market mode - Draw polygon to define market area"
        >
          Market
        </button>
        <button
          type="button"
          className={`${styles.toolButton} ${drawMode === 'reduce' ? styles.toolButtonActive : ''}`}
          onClick={() => handleModeChange('reduce')}
          title="Reduce mode - Draw polygon to exclude areas"
        >
          Reduce
        </button>
        <button
          type="button"
          className={`${styles.toolButton} ${drawMode === 'draw' ? styles.toolButtonActive : ''}`}
          onClick={() => handleModeChange('draw')}
          title="Draw mode - Free-hand polygon drawing"
        >
          Draw
        </button>
        {(selectedAreas.length > 0 || drawnPolygons.length > 0) && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={handleClearAll}
            title="Clear all selections"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Map Container */}
      <div className={styles.mapContainer}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={defaultCenter}
          zoom={4}
          onLoad={onLoad}
          options={{
            streetViewControl: false,
            mapTypeControl: true,
            fullscreenControl: true,
            zoomControl: true,
          }}
        >
          {drawMode && (
            <DrawingManager
              onPolygonComplete={onPolygonComplete}
              options={{
                drawingControl: false,
                drawingMode: google.maps.drawing.OverlayType.POLYGON,
                polygonOptions: {
                  fillColor: drawMode === 'reduce' ? '#FF0000' : '#00FF00',
                  fillOpacity: 0.2,
                  strokeColor: drawMode === 'reduce' ? '#FF0000' : '#00FF00',
                  strokeWeight: 2,
                  clickable: true,
                  editable: true,
                  draggable: true,
                },
              }}
            />
          )}
        </GoogleMap>

        {selectedAreas.length > 0 && (
          <div className={styles.selectedAreas}>
            <p className={styles.selectedAreasTitle}>Selected Cities:</p>
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

      <p className={styles.note}>
        Select a drawing mode above and click on the map to draw boundaries. Click on drawn
        polygons to remove them. Green polygons mark included areas, red polygons mark excluded
        areas.
      </p>
    </div>
  );
};
