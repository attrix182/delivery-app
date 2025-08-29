import { useEffect, useState, useRef } from 'react';
import RouteForm from './RouteForm';
import RouteResults from './RouteResults';

interface OptimizationResult {
  order: number[];
  points: Array<{
    lat: number;
    lng: number;
    label?: string;
  }>;
  matrix: number[][];
  hasDepot: boolean;
}

interface BottomSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  depot: string;
  stops: string;
  isLoading: boolean;
  returnToDepot: boolean;
  status?: string;
  result?: OptimizationResult;
  onDepotChange: (value: string) => void;
  onStopsChange: (value: string) => void;
  onReturnToDepotChange: (value: boolean) => void;
  onOptimize: () => void;
  onReorder: (newOrder: number[]) => void;
  renderOnMap: (result: OptimizationResult) => void;
  setResult: (result: OptimizationResult) => void;
}

export default function BottomSheetModal({
  isOpen,
  onClose,
  depot,
  stops,
  isLoading,
  returnToDepot,
  status,
  result,
  onDepotChange,
  onStopsChange,
  onReturnToDepotChange,
  onOptimize,
  renderOnMap,
  setResult
}: BottomSheetModalProps) {
  const [modalHeight, setModalHeight] = useState(400); // Altura inicial en px
  const [isResizing, setIsResizing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentHeightRef = useRef(400);
  const MIN_HEIGHT = 150; // Altura mínima antes de cerrar

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Event handlers para redimensionar el modal
  useEffect(() => {
    const updateHeight = (newHeight: number) => {
      currentHeightRef.current = newHeight;
      if (modalRef.current) {
        modalRef.current.style.height = `${newHeight}px`;
      }
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(() => {
        setModalHeight(newHeight);
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const deltaY = startY - e.clientY;
        const newHeight = Math.max(MIN_HEIGHT, Math.min(800, startHeight + deltaY));
        updateHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      if (isResizing) {
        // Solo cerrar si la altura es extremadamente pequeña
        if (currentHeightRef.current < MIN_HEIGHT) {
          onClose();
        } else {
          // Restaurar altura mínima si está muy cerca del límite
          updateHeight(Math.max(MIN_HEIGHT, currentHeightRef.current));
        }
      }
      setIsResizing(false);
      document.body.classList.remove('resizing');
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isResizing) {
        e.preventDefault();
        const touch = e.touches[0];
        const deltaY = startY - touch.clientY;
        const newHeight = Math.max(MIN_HEIGHT, Math.min(800, startHeight + deltaY));
        updateHeight(newHeight);
      }
    };

    const handleTouchEnd = () => {
      if (isResizing) {
        // Solo cerrar si la altura es extremadamente pequeña
        if (currentHeightRef.current < MIN_HEIGHT) {
          onClose();
        } else {
          // Restaurar altura mínima si está muy cerca del límite
          updateHeight(Math.max(MIN_HEIGHT, currentHeightRef.current));
        }
      }
      setIsResizing(false);
      document.body.classList.remove('resizing');
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isResizing, startY, startHeight, onClose]);

  // Sincronizar altura inicial cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      currentHeightRef.current = modalHeight;
      if (modalRef.current) {
        modalRef.current.style.height = `${modalHeight}px`;
      }
    }
  }, [isOpen, modalHeight]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay transparente */}
      <div 
        className="fixed inset-0 bg-transparent z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 z-50">
        <div 
          ref={modalRef}
          className={`bg-white/95 backdrop-blur-sm rounded-t-2xl shadow-2xl overflow-hidden ${
            isResizing ? '' : 'transition-all duration-300 ease-out'
          }`}
          style={{ 
            height: `${modalHeight}px`,
            transform: `translateY(${modalHeight < MIN_HEIGHT ? '100%' : '0'})`
          }}
        >
          {/* Handle de arrastre para redimensionar */}
          <div 
            className="flex justify-center pt-3 pb-2 modal-resize-handle"
            onMouseDown={(e) => {
              setIsResizing(true);
              setStartY(e.clientY);
              setStartHeight(modalHeight);
              document.body.classList.add('resizing');
            }}
            onTouchStart={(e) => {
              setIsResizing(true);
              setStartY(e.touches[0].clientY);
              setStartHeight(modalHeight);
              document.body.classList.add('resizing');
            }}
          >
            <div className="w-12 h-1 bg-gray-400 rounded-full resize-thumb"></div>
          </div>
          
          {/* Header */}
          <div className="px-4 pb-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Configurar Ruta</h2>
            <p className="text-sm text-gray-600">Ingresa las direcciones para optimizar tu ruta de entregas</p>
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-4 space-y-4" style={{ height: `calc(${modalHeight}px - 120px)` }}>
            {/* Formulario de ruta */}
            <RouteForm
              depot={depot}
              stops={stops}
              isLoading={isLoading}
              returnToDepot={returnToDepot}
              onDepotChange={onDepotChange}
              onStopsChange={onStopsChange}
              onReturnToDepotChange={onReturnToDepotChange}
              onOptimize={onOptimize}
            />

            {/* Status */}
            {status && (
              <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                {status}
              </div>
            )}

            {/* Resultados */}
            {result && (
              <RouteResults 
                result={result} 
                onReorder={(newOrder) => {
                  // Crear un nuevo resultado con el orden actualizado
                  const updatedResult = {
                    ...result,
                    order: newOrder
                  };
                  // Actualizar el estado local y re-renderizar en el mapa
                  setResult(updatedResult);
                  renderOnMap(updatedResult);
                }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
