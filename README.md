# Optimizador de Entregas

Una aplicación web moderna para optimizar rutas de entrega usando algoritmos TSP avanzados y Google Maps.

## Características

- **Algoritmos TSP Avanzados**: Fuerza bruta para problemas pequeños (≤8 puntos), múltiples heurísticas para problemas grandes
- **Integración con Google Maps**: Geocodificación, matriz de distancias y visualización de rutas
- **Interfaz Moderna**: Diseño responsive con Tailwind CSS
- **TypeScript**: Código completamente tipado
- **Next.js 14**: Framework moderno con App Router

## Algoritmos Implementados

1. **Fuerza Bruta**: Para problemas pequeños (≤8 puntos) - solución óptima garantizada
2. **Nearest Neighbor + 2-opt**: Algoritmo heurístico básico
3. **Nearest Neighbor + 3-opt**: Versión mejorada del 2-opt
4. **Algoritmo de Inserción**: Construye la ruta insertando nodos en la mejor posición
5. **Algoritmo Genético**: Para problemas medianos (≤15 puntos)

## Instalación

1. Clona el repositorio:
```bash
git clone <url-del-repositorio>
cd delivery-optimizer
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
Crea un archivo `.env.local` en la raíz del proyecto:
```env
# Google Maps API Key
# Obtén tu API key en: https://console.cloud.google.com/
# Habilita las siguientes APIs:
# - Maps JavaScript API
# - Geocoding API
# - Distance Matrix API
# - Directions API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key_de_google_maps
```

4. Ejecuta el servidor de desarrollo:
```bash
npm run dev
```

5. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Uso

1. **Depósito**: Ingresa la dirección del depósito o punto de partida
2. **Direcciones**: Agrega las direcciones de entrega, una por línea
3. **Optimizar**: Haz clic en el botón para calcular la ruta optimizada
4. **Resultados**: Visualiza el orden sugerido, tiempo estimado y enlaces a Google Maps

## Configuración de Google Maps

Para obtener una API key de Google Maps:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita las siguientes APIs (nuevas APIs de Google Maps Platform):
   - **Maps JavaScript API** (Essentials)
   - **Geocoding API** (Essentials)
   - **Compute Routes API** (Essentials) - reemplaza Directions API
   - **Compute Routes Matrix API** (Essentials) - reemplaza Distance Matrix API
4. Crea credenciales (API Key)
5. Restringe la API key por dominio para mayor seguridad

### APIs Migradas (Marzo 2025)
- ✅ **Directions API** → **Compute Routes API** (Essentials)
- ✅ **Distance Matrix API** → **Compute Routes Matrix API** (Essentials)
- ✅ **Geocoding API** → **Geocoding API** (Essentials) - sin cambios

### Free Tier
- **10K llamadas gratuitas** por API por mes (Essentials)
- **Sin crédito fijo** de $200 USD
- **Descuentos automáticos** por volumen

## Tecnologías Utilizadas

- **Next.js 14**: Framework de React
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Framework de CSS
- **Google Maps Platform** (nuevas APIs):
  - **Maps JavaScript API** (Essentials): Mapas interactivos
  - **Geocoding API** (Essentials): Conversión de direcciones a coordenadas
  - **Compute Routes API** (Essentials): Cálculo de rutas optimizadas
  - **Compute Routes Matrix API** (Essentials): Matriz de distancias y tiempos

## Estructura del Proyecto

```
src/
├── app/                 # App Router de Next.js
├── components/          # Componentes React
│   └── DeliveryOptimizer.tsx
├── utils/              # Utilidades
│   ├── tsp-algorithms.ts
│   └── google-maps.ts
└── types/              # Definiciones de tipos
    └── google-maps.d.ts
```

## Scripts Disponibles

- `npm run dev`: Servidor de desarrollo
- `npm run build`: Construir para producción
- `npm run start`: Servidor de producción
- `npm run lint`: Ejecutar ESLint

## Limitaciones

- **Compute Routes Matrix API**: Limitada a ~25 puntos por batch para matrices de distancia
- **Compute Routes API**: Máximo 23 waypoints por solicitud de ruta
- **Fallback**: Para más de 25 puntos se usa cálculo aproximado con fórmula de Haversine
- **Free Tier**: 10K llamadas gratuitas por API por mes (Essentials)

### Optimizaciones Implementadas
- ✅ **Controles deshabilitados**: `mapTypeControl`, `streetViewControl`, `fullscreenControl` para reducir costos
- ✅ **Matriz optimizada**: Construcción fila por fila para minimizar llamadas
- ✅ **Manejo de errores**: Fallback a Haversine para casos edge

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.
