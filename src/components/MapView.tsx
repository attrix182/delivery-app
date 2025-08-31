import { useRef, useEffect } from 'react';
import { config } from '@/config/env';

interface MapViewProps {
  isSidebarOpen: boolean;
  onMapReady: (map: google.maps.Map, directionsRenderer: google.maps.DirectionsRenderer) => void;
  isSmallScreen?: boolean;
  isModalOpen?: boolean;
}

export default function MapView({ isSidebarOpen, onMapReady, isSmallScreen = false, isModalOpen = false }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeMap();
  }, []);

  const initializeMap = async () => {
    try {
      // Cargar Google Maps usando script tradicional
      if (!window.google) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${config.googleMapsApiKey}&libraries=places`;
          script.async = true;
          script.defer = true;
          script.onload = () => {
            setTimeout(resolve, 100);
          };
          script.onerror = () => reject(new Error('Failed to load Google Maps'));
          document.head.appendChild(script);
        });
      }
      
      // Verificar que Google Maps esté disponible
      if (!window.google || !window.google.maps) {
        throw new Error('Google Maps not available');
      }
      
      if (mapRef.current) {
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: -34.6037, lng: -58.3816 },
          zoom: 12,
          // Deshabilitar controles para evitar costos extras
          mapTypeControl: false, // Oculta el botón de mapa/satélite
          streetViewControl: false, // Oculta el botón de Street View
          fullscreenControl: false, // Oculta el botón de pantalla completa
          zoomControl: true, // Mantener controles de zoom
          scrollwheel: true, // Permitir zoom con rueda del mouse
          disableDefaultUI: false, // No deshabilitar toda la UI por defecto
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        });

        const directionsRenderer = new google.maps.DirectionsRenderer({
          suppressMarkers: true,
        });
        directionsRenderer.setMap(map);

        onMapReady(map, directionsRenderer);
      }
    } catch (error) {
      console.error('Error loading Google Maps:', error);
    }
  };

  return (
    <div className="flex-1 relative">
      <div 
        ref={mapRef} 
        className="w-full h-[calc(100dvh-4rem)"
      />
      
      {/* Botón flotante para abrir sidebar/modal en móvil */}
      {isSmallScreen && !isSidebarOpen && !isModalOpen && (
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('toggleSidebar'))}
          className="absolute top-4 left-4 z-30 bg-white p-3 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      )}
    </div>
  );
}
