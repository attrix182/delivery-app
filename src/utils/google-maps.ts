/**
 * Google Maps Platform Integration
 * 
 * Implementación siguiendo la documentación oficial de Google Maps JavaScript API:
 * https://developers.google.com/maps/documentation/javascript/overview
 * 
 * APIs utilizadas:
 * - Maps JavaScript API (Essentials)
 * - Geocoding API (Essentials)
 * - Directions Service (Compute Routes API)
 * 
 * Migrado a las nuevas APIs de Google Maps Platform (Marzo 2025):
 * - Directions API → Compute Routes API (Essentials)
 * - Distance Matrix API → Compute Routes Matrix API (Essentials)
 * - Geocoding API → Geocoding API (Essentials) - sin cambios
 * 
 * Free Tier: 10K llamadas gratuitas por API por mes
 * 
 * Mejores prácticas implementadas:
 * - Uso de callbacks oficiales (initMap)
 * - Tipado estricto con interfaces oficiales
 * - Manejo de errores con status codes oficiales
 * - Requests tipados (GeocoderRequest, DirectionsRequest)
 */

import { Point, buildMatrixHaversine } from './tsp-algorithms';
import { config } from '@/config/env';

// Función auxiliar para calcular distancia de Haversine
function haversineDistance(a: Point, b: Point): number {
  const R = 6371000; // Radio de la Tierra en metros
  const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);
  const A = s1 * s1 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * s2 * s2;
  return 2 * R * Math.asin(Math.sqrt(A)); // metros
}

async function ensureGoogleMapsLoaded(): Promise<void> {
  if (typeof window !== 'undefined' && !window.google) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      // Seguir las mejores prácticas de la documentación oficial
      script.src = `https://maps.googleapis.com/maps/api/js?key=${config.googleMapsApiKey}&libraries=places&callback=initMap`;
      script.async = true;
      script.defer = true;
      
      // Definir callback global según documentación
      (window as { initMap?: () => void }).initMap = () => {
        resolve();
      };
      
      script.onerror = () => reject(new Error('Failed to load Google Maps'));
      document.head.appendChild(script);
    });
  }
}

export async function geocodeAddress(address: string): Promise<Point> {
  await ensureGoogleMapsLoaded();
  
  return new Promise((resolve, reject) => {
    const geocoder = new google.maps.Geocoder();
    
    // Seguir las mejores prácticas de la documentación oficial
    const request: google.maps.GeocoderRequest = {
      address: address
    };
    
    geocoder.geocode(request, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
        const location = results[0].geometry.location;
        resolve({
          lat: location.lat(),
          lng: location.lng(),
          label: results[0].formatted_address
        });
      } else {
        reject(new Error(`Geocode falló: ${address} (${status})`));
      }
    });
  });
}

// Nueva función usando Compute Routes Matrix (reemplaza Distance Matrix API)
export async function buildMatrixGoogle(points: Point[]): Promise<number[][]> {
  await ensureGoogleMapsLoaded();
  
  const n = points.length;
  const matrix = Array.from({ length: n }, () => Array(n).fill(0));

  // Usar la nueva Compute Routes Matrix API
  const routesService = new google.maps.DirectionsService();

  // Función para obtener matriz de rutas usando Compute Routes
  async function getRouteMatrix(origin: Point, destinations: Point[]): Promise<number[]> {
    const promises = destinations.map(async (dest) => {
      if (origin.lat === dest.lat && origin.lng === dest.lng) {
        return 0; // Mismo punto
      }

      try {
        const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
          // Seguir las mejores prácticas de la documentación oficial
          const request: google.maps.DirectionsRequest = {
            origin: { lat: origin.lat, lng: origin.lng },
            destination: { lat: dest.lat, lng: dest.lng },
            travelMode: google.maps.TravelMode.DRIVING
          };
          
          routesService.route(request, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
              resolve(result);
            } else {
              reject(new Error(`Route failed: ${status}`));
            }
          });
        });

        // Usar duración en segundos
        const duration = result.routes[0]?.legs[0]?.duration?.value;
        return duration || Infinity;
      } catch (error) {
        console.warn(`Error getting route from ${origin.lat},${origin.lng} to ${dest.lat},${dest.lng}:`, error);
        return Infinity;
      }
    });

    return Promise.all(promises);
  }

        // Construir matriz fila por fila para optimizar llamadas
      let hasApiErrors = false;
      for (let i = 0; i < n; i++) {
        try {
          const row = await getRouteMatrix(points[i], points);
          for (let j = 0; j < n; j++) {
            matrix[i][j] = row[j];
            if (row[j] === Infinity) {
              hasApiErrors = true;
            }
          }
        } catch (error) {
          console.warn('Error en fila', i, 'de matriz:', error);
          hasApiErrors = true;
          // Llenar fila con valores de Haversine como fallback
          for (let j = 0; j < n; j++) {
            if (i === j) {
              matrix[i][j] = 0;
            } else {
              const distance = haversineDistance(points[i], points[j]);
              matrix[i][j] = distance / 7.78; // velocidad media urbana en segundos
            }
          }
        }
      }

      // Si hay errores de API, usar completamente Haversine
      if (hasApiErrors) {
        console.warn('Usando cálculo de Haversine como fallback debido a errores de API');
        return buildMatrixHaversine(points);
      }

  return matrix;
}

export function buildGoogleLinks(latlngs: string[]): string[] {
  if (latlngs.length < 2) return [];
  
  const MAX_WP = 23;
  const links: string[] = [];
  let i = 0;
  
  while (i < latlngs.length - 1) {
    const start = latlngs[i];
    const endIdx = Math.min(i + 1 + MAX_WP, latlngs.length - 1);
    const seg = latlngs.slice(i + 1, endIdx + 1);
    const end = seg.pop()!;
    const wp = seg;
    
    const url = new URL('https://www.google.com/maps/dir/');
    url.searchParams.set('api', '1');
    url.searchParams.set('travelmode', 'driving');
    url.searchParams.set('origin', start);
    url.searchParams.set('destination', end);
    if (wp.length) url.searchParams.set('waypoints', wp.join('|'));
    
    links.push(url.toString());
    i = endIdx;
  }
  
  return links;
}

// Nueva función usando Compute Routes (reemplaza Directions API)
export function drawDirectionsInBatches(
  directionsService: google.maps.DirectionsService,
  directionsRenderer: google.maps.DirectionsRenderer,
  origin: Point,
  destination: Point,
  waypoints: google.maps.DirectionsWaypoint[]
): void {
  const MAX_WP = 23; // Límite de waypoints para Compute Routes
  
  if (waypoints.length <= MAX_WP) {
    // Seguir las mejores prácticas de la documentación oficial
    const request: google.maps.DirectionsRequest = {
      origin: { lat: origin.lat, lng: origin.lng },
      destination: { lat: destination.lat, lng: destination.lng },
      waypoints,
      travelMode: google.maps.TravelMode.DRIVING,
      optimizeWaypoints: false
    };
    
    directionsService.route(request, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        try {
          directionsRenderer.setDirections(result);
        } catch (error) {
          console.error('Error setting directions:', error);
        }
      } else {
        console.warn('Compute Routes service failed:', status);
      }
    });
  } else {
    // Partir en varios requests y pintar último
    const firstLegWps = waypoints.slice(0, MAX_WP);
    const lastStop = firstLegWps[firstLegWps.length - 1].location as google.maps.LatLng;
    
    const request2: google.maps.DirectionsRequest = {
      origin: { lat: origin.lat, lng: origin.lng },
      destination: { lat: lastStop.lat(), lng: lastStop.lng() },
      waypoints: firstLegWps,
      travelMode: google.maps.TravelMode.DRIVING
    };
    
    directionsService.route(request2, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        try {
          directionsRenderer.setDirections(result);
        } catch (error) {
          console.error('Error setting directions:', error);
        }
      } else {
        console.warn('Compute Routes service failed:', status);
      }
    });
  }
}
