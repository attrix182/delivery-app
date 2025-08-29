import { useState, useRef } from 'react';
import { Point, solveTSP, buildMatrixHaversine } from '@/utils/tsp-algorithms';
import { geocodeAddress, buildMatrixGoogle, drawDirectionsInBatches } from '@/utils/google-maps';

interface OptimizationResult {
  order: number[];
  points: Point[];
  matrix: number[][];
  hasDepot: boolean;
}

export function useRouteOptimization() {
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

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
      }
    }
  };

  const optimize = async (depot: string, stops: string) => {
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
      renderOnMap(optimizationResult);
      
      setStatus('Listo ✅');
    } catch (error) {
      console.error(error);
      setStatus(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const setMapInstances = (map: google.maps.Map, directionsRenderer: google.maps.DirectionsRenderer) => {
    mapInstanceRef.current = map;
    directionsRendererRef.current = directionsRenderer;
  };

  return {
    status,
    result,
    isLoading,
    optimize,
    setMapInstances,
  };
}
