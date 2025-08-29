import { Point } from '@/utils/tsp-algorithms';
import { buildGoogleLinks } from '@/utils/google-maps';

interface OptimizationResult {
  order: number[];
  points: Point[];
  matrix: number[][];
  hasDepot: boolean;
}

interface RouteResultsProps {
  result: OptimizationResult;
}

export default function RouteResults({ result }: RouteResultsProps) {
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
  );
}
