interface RouteFormProps {
  depot: string;
  stops: string;
  isLoading: boolean;
  returnToDepot: boolean;
  onDepotChange: (value: string) => void;
  onStopsChange: (value: string) => void;
  onReturnToDepotChange: (value: boolean) => void;
  onOptimize: () => void;
}

export default function RouteForm({ 
  depot, 
  stops, 
  isLoading, 
  returnToDepot,
  onDepotChange, 
  onStopsChange, 
  onReturnToDepotChange,
  onOptimize 
}: RouteFormProps) {
  return (
    <div className="space-y-4">
      {/* Depósito */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          🏢 Depósito (opcional)
        </label>
        <input
          type="text"
          value={depot}
          onChange={(e) => onDepotChange(e.target.value)}
          placeholder="Ej: Av. Corrientes 1234, CABA"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        />
        
        {/* Checkbox para regresar al depósito */}
        {depot.trim() && (
          <div className="mt-3 flex items-center">
            <input
              type="checkbox"
              id="returnToDepot"
              checked={returnToDepot}
              onChange={(e) => onReturnToDepotChange(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="returnToDepot" className="ml-2 text-sm text-gray-700">
              🔄 Finalizar recorrido regresando al depósito
            </label>
          </div>
        )}
      </div>

      {/* Direcciones */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          📍 Direcciones de entrega
        </label>
        <textarea
          value={stops}
          onChange={(e) => onStopsChange(e.target.value)}
          rows={8}
          placeholder="Dirección 1&#10;Dirección 2&#10;Dirección 3&#10;..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">Una dirección por línea</p>
      </div>

      {/* Botón Optimizar */}
      <div className="pt-2">
        <button
          onClick={onOptimize}
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
    </div>
  );
}
