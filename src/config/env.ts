export const config = {
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyB_pWLzliecPjn9kIueUhpzxA8642eVZws',
} as const;

// Debug: verificar que la API key se está cargando correctamente
if (typeof window !== 'undefined') {
  console.log('API Key loaded:', config.googleMapsApiKey ? 'Yes' : 'No');
  console.log('API Key starts with:', config.googleMapsApiKey?.substring(0, 10) + '...');
}
