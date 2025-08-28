'use client';

import { useState, useEffect, useRef } from 'react';
import { Point, solveTSP, buildMatrixHaversine, routeCost } from '@/utils/tsp-algorithms';
import { geocodeAddress, buildMatrixGoogle, buildGoogleLinks, drawDirectionsInBatches } from '@/utils/google-maps';
import { config } from '@/config/env';

interface OptimizationResult {
  order: number[];
  points: Point[];
  matrix: number[][];
  hasDepot: boolean;
}

export default function DeliveryOptimizer() {
  const [depot, setDepot] = useState('');
  const [stops, setStops] = useState('');
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

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
            // Esperar un poco más para asegurar que Google Maps esté completamente inicializado
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
      
      if (mapRef.current && !mapInstanceRef.current) {
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: -34.6037, lng: -58.3816 },
          zoom: 12,
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

        mapInstanceRef.current = map;
        directionsRendererRef.current = directionsRenderer;
      }
    } catch (error) {
      console.error('Error loading Google Maps:', error);
      setStatus('Error cargando Google Maps');
    }
  };

  const clearMap = () => {
    // Limpiar marcadores
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Limpiar direcciones
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setDirections(null);
    }

    // Resetear bounds
    if (mapInstanceRef.current) {
      const bounds = new google.maps.LatLngBounds();
      mapInstanceRef.current.fitBounds(bounds);
    }
  };

  const optimize = async () => {
    try {
      setIsLoading(true);
      setStatus('Geocodificando...');
      setResult(null);
      clearMap();

      const lines = stops.split('\n').map(s => s.trim()).filter(Boolean);
      if (lines.length === 0) {
        setStatus('Agregá al menos una dirección');
        return;
      }

      // Geocodificar depósito
      let depotPoint: Point | null = null;
      if (depot.trim()) {
        depotPoint = await geocodeAddress(depot.trim());
      }

      // Geocodificar paradas
      const stopPoints: Point[] = [];
      for (const line of lines) {
        stopPoints.push(await geocodeAddress(line));
      }

      setStatus('Construyendo matriz (Distance Matrix)...');
      
      const allPoints = depotPoint ? [depotPoint, ...stopPoints] : stopPoints;
      const n = allPoints.length;

      // Construir matriz de distancias
      let durationMatrix: number[][];
      if (n <= 25) {
        durationMatrix = await buildMatrixGoogle(allPoints);
      } else {
        durationMatrix = buildMatrixHaversine(allPoints);
      }

      // Optimizar ruta
      let orderLocal: number[];
      let hasDepot: boolean;
      let optimizationResult: OptimizationResult;

      if (depotPoint) {
        const subMatrix = durationMatrix.slice(1).map(row => row.slice(1));
        orderLocal = solveTSP(subMatrix, 0);
        const globalOrder = [0, ...orderLocal.map(i => i + 1)];
        hasDepot = true;
        optimizationResult = { order: globalOrder, points: allPoints, matrix: durationMatrix, hasDepot };
      } else {
        orderLocal = solveTSP(durationMatrix, 0);
        hasDepot = false;
        optimizationResult = { order: orderLocal, points: allPoints, matrix: durationMatrix, hasDepot };
      }

      setResult(optimizationResult);

      // Renderizar en mapa
      renderOnMap(optimizationResult);
      
      setStatus('Listo ✅');
    } catch (error) {
      console.error(error);
      setStatus(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderOnMap = (optimizationResult: OptimizationResult) => {
    if (!mapInstanceRef.current || !directionsRendererRef.current) return;

    const { order, points, matrix } = optimizationResult;
    const bounds = new google.maps.LatLngBounds();

    // Limpiar marcadores anteriores
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Crear marcadores
    order.forEach((pointIndex, k) => {
      const point = points[pointIndex];
      const marker = new google.maps.Marker({
        position: { lat: point.lat, lng: point.lng },
        label: (k + 1).toString(),
        map: mapInstanceRef.current
      });
      
      markersRef.current.push(marker);
      bounds.extend(marker.getPosition()!);
    });

    mapInstanceRef.current.fitBounds(bounds);

    // Solo dibujar ruta si hay más de un punto
    if (order.length > 1) {
      const origin = points[order[0]];
      const destination = points[order[order.length - 1]];
      const waypoints = order.slice(1, -1).map(i => ({
        location: { lat: points[i].lat, lng: points[i].lng },
        stopover: true
      }));

      try {
        drawDirectionsInBatches(
          new google.maps.DirectionsService(),
          directionsRendererRef.current,
          origin,
          destination,
          waypoints
        );
      } catch (error) {
        console.error('Error dibujando direcciones:', error);
        // Si falla, al menos mostrar los marcadores
      }
    }
  };

  const getAlgorithmInfo = (n: number) => {
    return n <= 8 ? 'Fuerza bruta (óptimo)' : 'Heurístico múltiple (NN+2-opt+3-opt+inserción+genético)';
  };

  const getTotalTime = (result: OptimizationResult) => {
    let total = 0;
    for (let k = 0; k < result.order.length - 1; k++) {
      total += result.matrix[result.order[k]][result.order[k + 1]];
    }
    return Math.round(total / 60);
  };

  const getGoogleLinks = (result: OptimizationResult) => {
    const latlngs = result.order.map(i => `${result.points[i].lat},${result.points[i].lng}`);
    return buildGoogleLinks(latlngs);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Optimizador de Entregas</h1>
          </div>
          
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static absolute inset-y-0 left-0 z-20 w-80 bg-white shadow-xl border-r border-gray-200 transition-transform duration-300 ease-in-out`}>
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Configurar Ruta</h2>
              <p className="text-sm text-gray-600">Ingresa las direcciones para optimizar tu ruta de entregas</p>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Depósito */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🏢 Depósito (opcional)
                </label>
                <input
                  type="text"
                  value={depot}
                  onChange={(e) => setDepot(e.target.value)}
                  placeholder="Ej: Av. Corrientes 1234, CABA"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>

              {/* Direcciones */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📍 Direcciones de entrega
                </label>
                <textarea
                  value={stops}
                  onChange={(e) => setStops(e.target.value)}
                  rows={8}
                  placeholder="Dirección 1&#10;Dirección 2&#10;Dirección 3&#10;..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">Una dirección por línea</p>
              </div>

              {/* Botón Optimizar */}
              <div className="pt-2">
                <button
                  onClick={optimize}
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Optimizando...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Optimizar Ruta</span>
                    </>
                  )}
                </button>
              </div>

              {/* Status */}
              {status && (
                <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                  {status}
                </div>
              )}

              {/* Resultados */}
              {result && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-blue-900">Ruta Optimizada</h3>
                  </div>

                  {/* Métricas */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                      <div className="text-xs text-blue-600 font-medium">Tiempo Total</div>
                      <div className="text-lg font-bold text-blue-900">{getTotalTime(result)} min</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                      <div className="text-xs text-blue-600 font-medium">Puntos</div>
                      <div className="text-lg font-bold text-blue-900">{result.points.length}</div>
                    </div>
                  </div>

                  {/* Algoritmo */}
                  <div className="bg-white rounded-lg p-3 border border-blue-100">
                    <div className="text-xs text-blue-600 font-medium">Algoritmo</div>
                    <div className="text-sm text-blue-900">{getAlgorithmInfo(result.points.length)}</div>
                  </div>

                  {/* Orden de paradas */}
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Orden de paradas:</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {result.order.map((pointIndex, idx) => (
                        <div key={idx} className="flex items-center space-x-2 text-sm">
                          <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                            {idx + 1}
                          </div>
                          <span className="text-gray-700 truncate">
                            {result.points[pointIndex].label || `${result.points[pointIndex].lat}, ${result.points[pointIndex].lng}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Enlaces Google Maps */}
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Abrir en Google Maps:</h4>
                    <div className="space-y-2">
                      {getGoogleLinks(result).map((link, i) => (
                        <a
                          key={i}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full bg-blue-600 text-white text-center py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          {i === 0 ? 'Abrir Ruta Completa' : `Tramo ${i + 1}`}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Nota informativa */}
              <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                <p className="font-medium mb-1">ℹ️ Información:</p>
                <p>• Google limita matrices a ~25 puntos por batch</p>
                <p>• Para más puntos se usa cálculo aproximado</p>
                <p>• Los waypoints están limitados a 23 por tramo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Overlay para móvil */}
        {isSidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-10"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Mapa */}
        <div className="flex-1 relative">
          <div 
            ref={mapRef} 
            className="w-full h-full"
          />
          
          {/* Botón flotante para abrir sidebar en móvil */}
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden absolute top-4 left-4 z-30 bg-white p-3 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
