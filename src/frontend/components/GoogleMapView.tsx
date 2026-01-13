import React, { useState, useCallback } from 'react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { useGoogleMaps } from '../contexts/GoogleMapsProvider';

export interface MapLocation {
  lat: number;
  lng: number;
  title?: string;
  description?: string;
  icon?: string;
}

interface GoogleMapViewProps {
  center?: MapLocation;
  zoom?: number;
  locations?: MapLocation[];
  height?: string;
  width?: string;
  onMapClick?: (e: google.maps.MapMouseEvent) => void;
  showMarkers?: boolean;
  containerStyle?: React.CSSProperties;
  mapContainerStyle?: React.CSSProperties;
}

const defaultCenter: MapLocation = {
  lat: 39.8283, // Center of USA
  lng: -98.5795,
};

const defaultMapContainerStyle = {
  width: '100%',
  height: '400px',
};

export const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  center = defaultCenter,
  zoom = 4,
  locations = [],
  height = '400px',
  width = '100%',
  onMapClick,
  showMarkers = true,
  containerStyle,
  mapContainerStyle,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const { isLoaded, loadError } = useGoogleMaps();

  console.log('GoogleMapView rendering:', { isLoaded, loadError, locations });

  const handleMarkerClick = useCallback((location: MapLocation) => {
    setSelectedLocation(location);
  }, []);

  const handleInfoWindowClose = useCallback(() => {
    setSelectedLocation(null);
  }, []);

  if (loadError) {
    return (
      <div style={{ ...defaultMapContainerStyle, ...mapContainerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
        <div style={{ textAlign: 'center', color: '#666' }}>
          <p style={{ fontSize: '16px', fontWeight: 600 }}>Failed to load map</p>
          <p style={{ fontSize: '14px' }}>Please check your internet connection</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{ ...defaultMapContainerStyle, ...mapContainerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
        <div style={{ textAlign: 'center', color: '#666' }}>
          <p style={{ fontSize: '16px' }}>Loading map...</p>
        </div>
      </div>
    );
  }

  const finalMapContainerStyle = mapContainerStyle || {
    width: width,
    height: height,
  };

  console.log('Rendering GoogleMap component with:', { center, zoom, finalMapContainerStyle });

  return (
    <div style={containerStyle}>
      <GoogleMap
        mapContainerStyle={finalMapContainerStyle}
        center={center}
        zoom={zoom}
        onClick={onMapClick}
        onLoad={(map) => {
          console.log('GoogleMap onLoad called!', { map, center, zoom });
        }}
        onUnmount={() => {
          console.log('GoogleMap unmounting');
        }}
        options={{
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
          zoomControl: true,
        }}
      >
        {showMarkers && locations.map((location, index) => (
          <Marker
            key={`marker-${index}`}
            position={{ lat: location.lat, lng: location.lng }}
            title={location.title}
            onClick={() => handleMarkerClick(location)}
            icon={location.icon}
          />
        ))}

        {selectedLocation && (selectedLocation.title || selectedLocation.description) && (
          <InfoWindow
            position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
            onCloseClick={handleInfoWindowClose}
          >
            <div style={{ padding: '8px', maxWidth: '200px' }}>
              {selectedLocation.title && (
                <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 600 }}>
                  {selectedLocation.title}
                </h3>
              )}
              {selectedLocation.description && (
                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                  {selectedLocation.description}
                </p>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

export default GoogleMapView;
