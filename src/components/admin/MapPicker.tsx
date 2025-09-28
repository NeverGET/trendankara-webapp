'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button-reui';
import { Input } from '@/components/ui/input-reui';
import { MapPin, Search, X } from 'lucide-react';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then(mod => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then(mod => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then(mod => mod.Marker),
  { ssr: false }
);

// Note: useMapEvents is a hook and can't be dynamically imported directly
// It's handled inside the LocationPicker component below

interface MapPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (location: {
    latitude: number;
    longitude: number;
    address?: string;
  }) => void;
  initialLocation?: {
    latitude: number;
    longitude: number;
  };
}

function LocationPicker({ onLocationClick }: any) {
  const MapEventsComponent = () => {
    const { useMapEvents } = require('react-leaflet');
    const map = useMapEvents({
      click: (e: any) => {
        onLocationClick([e.latlng.lat, e.latlng.lng]);
      },
    });
    return null;
  };

  return <MapEventsComponent />;
}

export function MapPicker({
  isOpen,
  onClose,
  onSelect,
  initialLocation
}: MapPickerProps) {
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(
    initialLocation ? [initialLocation.latitude, initialLocation.longitude] : null
  );
  const [searchAddress, setSearchAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [addressDisplay, setAddressDisplay] = useState('');

  // Default to Istanbul, Turkey
  const defaultCenter: [number, number] = [41.0082, 28.9784];
  const center = selectedPosition || defaultCenter;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Import Leaflet CSS
      require('leaflet/dist/leaflet.css');

      // Fix Leaflet default marker icon issue
      const L = require('leaflet');
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    }
  }, []);

  const searchLocation = async () => {
    if (!searchAddress.trim()) return;

    setIsSearching(true);
    try {
      // Use Nominatim (OpenStreetMap) geocoding API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          searchAddress
        )}&format=json&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        setSelectedPosition([lat, lon]);
        setAddressDisplay(result.display_name);
      } else {
        alert('Adres bulunamadı. Lütfen daha detaylı bir adres girin.');
      }
    } catch (error) {
      console.error('Error searching location:', error);
      alert('Konum arama hatası oluştu.');
    } finally {
      setIsSearching(false);
    }
  };

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
      );
      const data = await response.json();
      if (data && data.display_name) {
        setAddressDisplay(data.display_name);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      setAddressDisplay('');
    }
  };

  const handleMapClick = (position: [number, number]) => {
    setSelectedPosition(position);
    reverseGeocode(position[0], position[1]);
  };

  const handleConfirm = () => {
    if (selectedPosition) {
      onSelect({
        latitude: selectedPosition[0],
        longitude: selectedPosition[1],
        address: addressDisplay
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-dark-surface-primary rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden border border-dark-border-primary">
        {/* Header */}
        <div className="border-b border-dark-border-primary p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-dark-text-primary">
            <MapPin className="h-5 w-5" />
            Konum Seçin
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-dark-border-primary">
          <div className="flex gap-2">
            <Input
              placeholder="Adres ara... (örn: Ankara, Kızılay)"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
              className="flex-1"
            />
            <Button
              onClick={searchLocation}
              disabled={isSearching}
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              {isSearching ? 'Aranıyor...' : 'Ara'}
            </Button>
          </div>
          {addressDisplay && (
            <p className="text-sm text-dark-text-secondary mt-2">
              <strong>Seçilen Adres:</strong> {addressDisplay}
            </p>
          )}
        </div>

        {/* Map */}
        <div className="h-[500px] relative">
          {typeof window !== 'undefined' && (
            <MapContainer
              center={center}
              zoom={13}
              className="h-full w-full"
              key={center.join(',')}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {selectedPosition && (
                <Marker position={selectedPosition} />
              )}
              <LocationPicker
                onLocationClick={handleMapClick}
              />
            </MapContainer>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-dark-border-primary flex justify-between items-center">
          <p className="text-sm text-dark-text-tertiary">
            Haritaya tıklayarak konum seçebilirsiniz
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={onClose}
            >
              İptal
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedPosition}
              className="flex items-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              Konumu Seç
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}