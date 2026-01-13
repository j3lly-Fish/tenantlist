import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';

interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: Error | undefined;
}

const GoogleMapsContext = createContext<GoogleMapsContextType | undefined>(undefined);

const GOOGLE_MAPS_API_KEY = 'AIzaSyAYZu0d6O2lbh45TXdsHk2zRQES_IusYv4';
const libraries = ['drawing', 'places'];

export const GoogleMapsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    // Check if already loaded
    if (window.google?.maps) {
      console.log('Google Maps already loaded');
      setIsLoaded(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      console.log('Google Maps script already exists, waiting for load');
      existingScript.addEventListener('load', () => {
        console.log('Google Maps loaded from existing script');
        setIsLoaded(true);
      });
      return;
    }

    // Load the script manually
    console.log('Loading Google Maps script manually...');
    const script = document.createElement('script');
    const librariesParam = libraries.join(',');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=${librariesParam}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log('Google Maps loaded successfully!', { hasGoogle: !!window.google, hasMaps: !!window.google?.maps });
      setIsLoaded(true);
    };

    script.onerror = (error) => {
      console.error('Google Maps failed to load:', error);
      setLoadError(new Error('Failed to load Google Maps'));
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount (optional)
      script.remove();
    };
  }, []);

  console.log('GoogleMapsProvider rendering', { isLoaded, loadError, hasGoogle: !!window.google });

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  );
};

export const useGoogleMaps = (): GoogleMapsContextType => {
  const context = useContext(GoogleMapsContext);
  if (context === undefined) {
    throw new Error('useGoogleMaps must be used within a GoogleMapsProvider');
  }
  return context;
};
