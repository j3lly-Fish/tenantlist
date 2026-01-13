import React, { useEffect, useRef, useState } from 'react';
import { useGoogleMaps } from '../contexts/GoogleMapsProvider';

export interface MapLocation {
  lat: number;
  lng: number;
  title?: string;
  description?: string;
  icon?: string;
}

interface GoogleMapViewDirectProps {
  center?: MapLocation;
  zoom?: number;
  locations?: MapLocation[];
  height?: string;
  width?: string;
  onMapClick?: (e: google.maps.MapMouseEvent) => void;
  showMarkers?: boolean;
}

const defaultCenter: MapLocation = {
  lat: 39.8283, // Center of USA
  lng: -98.5795,
};

export const GoogleMapViewDirect: React.FC<GoogleMapViewDirectProps> = ({
  center = defaultCenter,
  zoom = 4,
  locations = [],
  height = '400px',
  width = '100%',
  onMapClick,
  showMarkers = true,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const { isLoaded, loadError } = useGoogleMaps();

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.google?.maps) {
      console.log('Cannot initialize map yet:', { isLoaded, hasRef: !!mapRef.current, hasGoogle: !!window.google?.maps });
      return;
    }

    console.log('Initializing Google Map directly!');

    // Create map
    const map = new google.maps.Map(mapRef.current, {
      center: { lat: center.lat, lng: center.lng },
      zoom: zoom,
      streetViewControl: false,
      mapTypeControl: true,
      fullscreenControl: true,
      zoomControl: true,
    });

    mapInstanceRef.current = map;

    if (onMapClick) {
      map.addListener('click', onMapClick);
    }

    console.log('Map initialized successfully!', map);
  }, [isLoaded, center.lat, center.lng, zoom, onMapClick]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current || !showMarkers) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    locations.forEach((location) => {
      const marker = new google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: mapInstanceRef.current!,
        title: location.title,
      });

      if (location.title || location.description) {
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; max-width: 200px;">
              ${location.title ? `<h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600;">${location.title}</h3>` : ''}
              ${location.description ? `<p style="margin: 0; font-size: 12px; color: #666;">${location.description}</p>` : ''}
            </div>
          `,
        });

        marker.addListener('click', () => {
          infoWindow.open(mapInstanceRef.current!, marker);
        });
      }

      markersRef.current.push(marker);
    });
  }, [locations, showMarkers]);

  if (loadError) {
    return (
      <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
        <div style={{ textAlign: 'center', color: '#666' }}>
          <p style={{ fontSize: '16px', fontWeight: 600 }}>Failed to load map</p>
          <p style={{ fontSize: '14px' }}>Please check your internet connection</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
        <div style={{ textAlign: 'center', color: '#666' }}>
          <p style={{ fontSize: '16px' }}>Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      style={{ width, height }}
    />
  );
};

export default GoogleMapViewDirect;
