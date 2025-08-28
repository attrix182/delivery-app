import { Point } from './tsp-algorithms';
import { config } from '@/config/env';

async function ensureGoogleMapsLoaded(): Promise<void> {
  if (typeof window !== 'undefined' && !window.google) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${config.googleMapsApiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Maps'));
      document.head.appendChild(script);
    });
  }
}

export async function geocodeAddress(address: string): Promise<Point> {
  await ensureGoogleMapsLoaded();
  
  return new Promise((resolve, reject) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const { lat, lng } = results[0].geometry.location;
        resolve({
          label: address,
          lat: lat(),
          lng: lng()
        });
      } else {
        reject(new Error(`Geocode falló: ${address} (${status})`));
      }
    });
  });
}

export async function buildMatrixGoogle(points: Point[]): Promise<number[][]> {
  await ensureGoogleMapsLoaded();
  const service = new google.maps.DistanceMatrixService();
  const n = points.length;
  const matrix = Array.from({ length: n }, () => Array(n).fill(0));

  function getDistanceMatrix(origins: Point[], destinations: Point[]): Promise<google.maps.DistanceMatrixResponse> {
    return new Promise((resolve, reject) => {
      service.getDistanceMatrix({
        origins: origins.map(p => ({ lat: p.lat, lng: p.lng })),
        destinations: destinations.map(p => ({ lat: p.lat, lng: p.lng })),
        travelMode: google.maps.TravelMode.DRIVING
      }, (response, status) => {
        if (status !== 'OK' || !response) {
          reject(new Error(`DistanceMatrix ${status}`));
        } else {
          resolve(response);
        }
      });
    });
  }

  // Pedimos fila por fila para simplificar (n llamadas)
  for (let i = 0; i < n; i++) {
    const response = await getDistanceMatrix([points[i]], points);
    const row = response.rows[0].elements;
    for (let j = 0; j < n; j++) {
      matrix[i][j] = i === j ? 0 : (row[j].duration?.value ?? Infinity); // segundos
    }
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

export function drawDirectionsInBatches(
  directionsService: google.maps.DirectionsService,
  directionsRenderer: google.maps.DirectionsRenderer,
  origin: Point,
  destination: Point,
  waypoints: google.maps.DirectionsWaypoint[]
): void {
  const MAX_WP = 23;
  
  if (waypoints.length <= MAX_WP) {
    directionsService.route({
      origin: { lat: origin.lat, lng: origin.lng },
      destination: { lat: destination.lat, lng: destination.lng },
      waypoints,
      travelMode: google.maps.TravelMode.DRIVING,
      optimizeWaypoints: false
    }, (result, status) => {
      if (status === 'OK' && result) {
        try {
          directionsRenderer.setDirections(result);
        } catch (error) {
          console.error('Error setting directions:', error);
        }
      } else {
        console.warn('Directions service failed:', status);
      }
    });
  } else {
    // Partir en varios requests y pintar último
    const firstLegWps = waypoints.slice(0, MAX_WP);
    const lastStop = firstLegWps[firstLegWps.length - 1].location as google.maps.LatLng;
    
    directionsService.route({
      origin: { lat: origin.lat, lng: origin.lng },
      destination: { lat: lastStop.lat(), lng: lastStop.lng() },
      waypoints: firstLegWps,
      travelMode: google.maps.TravelMode.DRIVING
    }, (result, status) => {
      if (status === 'OK' && result) {
        try {
          directionsRenderer.setDirections(result);
        } catch (error) {
          console.error('Error setting directions:', error);
        }
      } else {
        console.warn('Directions service failed:', status);
      }
    });
  }
}
