import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Circle } from '@react-google-maps/api';
import { MapPin, Search, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TaskLocation } from '@/hooks/useTasks';

interface LocationPickerProps {
  value?: TaskLocation;
  onChange: (location: TaskLocation | undefined) => void;
  onClose: () => void;
}

const mapContainerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '12px',
};

const defaultCenter = {
  lat: 20.5937, // Center of India
  lng: 78.9629,
};

const libraries: ("places")[] = ["places"];

export const LocationPicker = ({ value, onChange, onClose }: LocationPickerProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    value ? { lat: value.lat, lng: value.lng } : null
  );
  const [locationName, setLocationName] = useState(value?.name || '');
  const [radius, setRadius] = useState(value?.radius || 100);
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState(value ? { lat: value.lat, lng: value.lng } : defaultCenter);
  
  const mapRef = useRef<google.maps.Map | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  // Initialize autocomplete when map is loaded
  useEffect(() => {
    if (isLoaded && inputRef.current && !autocompleteRef.current) {
      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'in' }, // Restrict to India
        fields: ['geometry', 'name', 'formatted_address'],
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        if (place?.geometry?.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          setSelectedLocation({ lat, lng });
          setMapCenter({ lat, lng });
          setLocationName(place.name || place.formatted_address || 'Selected Location');
          mapRef.current?.panTo({ lat, lng });
        }
      });
    }
  }, [isLoaded]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setSelectedLocation({ lat, lng });
      
      // Reverse geocode to get location name
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          setLocationName(results[0].formatted_address);
        }
      });
    }
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser');
      return;
    }

    setIsSearching(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setSelectedLocation({ lat, lng });
        setMapCenter({ lat, lng });
        mapRef.current?.panTo({ lat, lng });
        
        // Reverse geocode
        if (isLoaded) {
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results?.[0]) {
              setLocationName(results[0].formatted_address);
            } else {
              setLocationName('Current Location');
            }
          });
        }
        setIsSearching(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Failed to get your location. Please check permissions.');
        setIsSearching(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = () => {
    if (selectedLocation && locationName) {
      onChange({
        name: locationName,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        radius,
      });
      onClose();
    }
  };

  const handleClear = () => {
    onChange(undefined);
    onClose();
  };

  if (loadError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="glass-card p-6 max-w-md mx-4">
          <p className="text-destructive">Failed to load Google Maps. Please check your API key.</p>
          <Button onClick={onClose} className="mt-4 w-full">Close</Button>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="glass-card p-6">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground mt-2">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-lg mx-4 mb-4 animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-xl p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Select Location
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a location..."
                className="pl-10 h-11 rounded-xl"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={getCurrentLocation}
              disabled={isSearching}
              className="h-11 w-11 rounded-xl"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MapPin className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Map */}
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={14}
            onClick={onMapClick}
            onLoad={onMapLoad}
            options={{
              disableDefaultUI: true,
              zoomControl: true,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
            }}
          >
            {selectedLocation && (
              <>
                <Marker position={selectedLocation} />
                <Circle
                  center={selectedLocation}
                  radius={radius}
                  options={{
                    fillColor: 'hsl(var(--primary))',
                    fillOpacity: 0.2,
                    strokeColor: 'hsl(var(--primary))',
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                  }}
                />
              </>
            )}
          </GoogleMap>

          {/* Location Name */}
          {selectedLocation && (
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Location Name
              </label>
              <Input
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g., Office, Home, Gym"
                className="h-11 rounded-xl"
              />
            </div>
          )}

          {/* Radius */}
          {selectedLocation && (
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Notification Radius: {radius}m
              </label>
              <div className="flex gap-2">
                {[50, 100, 200, 500].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRadius(r)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                      radius === r
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {r}m
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                You'll be notified when within this distance of the location
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 pt-0 space-y-2">
          <Button
            onClick={handleSave}
            disabled={!selectedLocation || !locationName}
            className="w-full h-12 rounded-xl"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Save Location
          </Button>
          {value && (
            <Button
              variant="outline"
              onClick={handleClear}
              className="w-full h-12 rounded-xl text-destructive border-destructive"
            >
              Remove Location
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};