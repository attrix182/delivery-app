import { useState } from 'react';
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
  onReorder?: (newOrder: number[]) => void;
}

export default function RouteResults({ result, onReorder }: RouteResultsProps) {
  const [localOrder, setLocalOrder] = useState(result.order);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const getAlgorithmInfo = (n: number) => {
    return n <= 8 ? 'Fuerza bruta (óptimo)' : 'Heurístico múltiple (NN+2-opt+3-opt+inserción+genético)';
  };

  const getTotalTime = (result: OptimizationResult, order?: number[]) => {
    const orderToUse = order || result.order;
    let total = 0;
    for (let k = 0; k < orderToUse.length - 1; k++) {
      total += result.matrix[orderToUse[k]][orderToUse[k + 1]];
    }
    return Math.round(total / 60);
  };

  const getGoogleLinks = (result: OptimizationResult, order?: number[]) => {
    const orderToUse = order || result.order;
    const latlngs = orderToUse.map(i => `${result.points[i].lat},${result.points[i].lng}`);
    return buildGoogleLinks(latlngs);
  };

  const handleReorder = (newOrder: number[]) => {
    setLocalOrder(newOrder);
    if (onReorder) {
      onReorder(newOrder);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    console.log('Drag start:', index);
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', index.toString());
    e.dataTransfer.setData('text/plain', index.toString());
    
    // Mejorar la experiencia visual
    if (e.target instanceof HTMLElement) {
      e.target.style.opacity = '0.5';
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Mostrar indicador visual de dónde se va a soltar
    const targetElement = e.currentTarget as HTMLElement;
    if (targetElement && draggedIndex !== null && draggedIndex !== index) {
      targetElement.style.borderTop = '2px solid #3b82f6';
      targetElement.style.borderBottom = '2px solid #3b82f6';
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Limpiar indicadores visuales
    const targetElement = e.currentTarget as HTMLElement;
    if (targetElement) {
      targetElement.style.borderTop = '';
      targetElement.style.borderBottom = '';
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    let dragIndex = parseInt(e.dataTransfer.getData('text/html'));
    if (isNaN(dragIndex)) {
      dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    }
    console.log('Drop event:', { dragIndex, dropIndex, draggedIndex });
    
    // Limpiar indicadores visuales
    const targetElement = e.currentTarget as HTMLElement;
    if (targetElement) {
      targetElement.style.borderTop = '';
      targetElement.style.borderBottom = '';
      targetElement.style.opacity = '';
    }
    
    if (dragIndex !== dropIndex && !isNaN(dragIndex) && dragIndex >= 0) {
      console.log('Reordering from', dragIndex, 'to', dropIndex);
      const newOrder = [...localOrder];
      const [removed] = newOrder.splice(dragIndex, 1);
      newOrder.splice(dropIndex, 0, removed);
      console.log('New order:', newOrder);
      handleReorder(newOrder);
    }
    
    setDraggedIndex(null);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Limpiar todos los estilos
    if (e.target instanceof HTMLElement) {
      e.target.style.opacity = '';
    }
    
    // Limpiar todos los indicadores visuales
    const allStops = document.querySelectorAll('.draggable-stop');
    allStops.forEach((stop) => {
      if (stop instanceof HTMLElement) {
        stop.style.borderTop = '';
        stop.style.borderBottom = '';
        stop.style.opacity = '';
      }
    });
    
    setDraggedIndex(null);
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center space-x-2">
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-semibold text-blue-900">Ruta Optimizada</h3>
        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
          Arrastra para reorganizar
        </span>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg p-3 border border-blue-100">
          <div className="text-xs text-blue-600 font-medium">Tiempo Total</div>
          <div className="text-lg font-bold text-blue-900">{getTotalTime(result, localOrder)} min</div>
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

      {/* Orden de paradas con drag and drop */}
      <div>
        <h4 className="text-sm font-medium text-blue-900 mb-2">Orden de paradas:</h4>
        <div 
          className="space-y-1"
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          }}
          onDrop={(e) => {
            e.preventDefault();
            // Si se suelta en el contenedor, no hacer nada
            console.log('Dropped on container');
          }}
        >
          {localOrder.map((pointIndex, idx) => (
            <DraggableStop
              key={`${pointIndex}-${idx}`}
              pointIndex={pointIndex}
              index={idx}
              point={result.points[pointIndex]}
              isDragging={draggedIndex === idx}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>
      </div>

      {/* Enlaces Google Maps */}
      <div>
        <h4 className="text-sm font-medium text-blue-900 mb-2">Abrir en Google Maps:</h4>
        <div className="space-y-2">
          {getGoogleLinks(result, localOrder).map((link, i) => (
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

// Componente para cada parada arrastrable
function DraggableStop({ 
  pointIndex, 
  index, 
  point, 
  isDragging,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd
}: {
  pointIndex: number;
  index: number;
  point: Point;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: (e: React.DragEvent) => void;
}) {
      return (
      <div
        draggable
        className={`draggable-stop flex items-center space-x-2 text-sm p-2 rounded-lg transition-all cursor-move ${
          isDragging 
            ? 'bg-blue-100 shadow-lg scale-105 opacity-50' 
            : 'bg-white hover:bg-gray-50'
        }`}
        onDragStart={(e) => {
          console.log('DraggableStop drag start:', index);
          onDragStart(e, index);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          onDragOver(e, index);
        }}
        onDragLeave={onDragLeave}
        onDrop={(e) => {
          console.log('DraggableStop drop:', index);
          onDrop(e, index);
        }}
        onDragEnd={onDragEnd}
      >
      <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
        {index + 1}
      </div>
      <span className="text-gray-700 truncate flex-1">
        {point.label || `${point.lat}, ${point.lng}`}
      </span>
      <div className="w-4 h-4 text-gray-400">
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 2zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 14zm6-8a2 2 0 1 1-.001-4.001A2 2 0 0 1 13 6zm0 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 14z" />
        </svg>
      </div>
    </div>
  );
}
