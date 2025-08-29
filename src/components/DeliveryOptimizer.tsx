'use client';

import { useState, useEffect } from 'react';
import Header from './Header';
import MapView from './MapView';
import ResizableSidebar from './ResizableSidebar';
import BottomSheetModal from './BottomSheetModal';
import RouteForm from './RouteForm';
import RouteResults from './RouteResults';

import { useRouteOptimization } from '@/hooks/useRouteOptimization';

export default function DeliveryOptimizer() {
  const [depot, setDepot] = useState('');
  const [stops, setStops] = useState('');
  const [returnToDepot, setReturnToDepot] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  
  const { status, result, isLoading, optimize, setMapInstances, setResult, renderOnMap } = useRouteOptimization();

  const handleOptimize = () => {
    optimize(depot, stops, returnToDepot);
  };

  const handleMapReady = (map: google.maps.Map, directionsRenderer: google.maps.DirectionsRenderer) => {
    setMapInstances(map, directionsRenderer);
  };

  const handleToggleSidebar = () => {
    if (isSmallScreen) {
      setIsModalOpen(!isModalOpen);
    } else {
      setIsSidebarOpen(!isSidebarOpen);
    }
  };

  // Hook para detectar el tamaño de la pantalla
  useEffect(() => {
    const handleResize = () => {
      const isSmall = window.innerWidth < 480;
      setIsSmallScreen(isSmall);
      if (isSmall) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
        setIsModalOpen(false);
      }
    };

    // Ejecutar al montar el componente
    handleResize();

    // Escuchar cambios de tamaño
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Escuchar eventos de toggle del sidebar desde el mapa
  useEffect(() => {
    const handleToggleEvent = () => {
      if (isSmallScreen) {
        setIsModalOpen(true);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('toggleSidebar', handleToggleEvent);
    return () => window.removeEventListener('toggleSidebar', handleToggleEvent);
  }, [isSmallScreen]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <Header 
        isSidebarOpen={isSidebarOpen} 
        onToggleSidebar={handleToggleSidebar}
        isSmallScreen={isSmallScreen}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <ResizableSidebar isOpen={isSidebarOpen}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Configurar Ruta</h2>
            <p className="text-sm text-gray-600">Ingresa las direcciones para optimizar tu ruta de entregas</p>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Formulario de ruta */}
            <RouteForm
              depot={depot}
              stops={stops}
              isLoading={isLoading}
              returnToDepot={returnToDepot}
              onDepotChange={setDepot}
              onStopsChange={setStops}
              onReturnToDepotChange={setReturnToDepot}
              onOptimize={handleOptimize}
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
                result={result || undefined} 
                onReorder={(newOrder: number[]) => {
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
        </ResizableSidebar>

        {/* Overlay para móvil */}
        {isSidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-transparent z-10"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Mapa */}
        <MapView 
          isSidebarOpen={isSidebarOpen} 
          onMapReady={handleMapReady}
          isSmallScreen={isSmallScreen}
          isModalOpen={isModalOpen}
        />
      </div>

      {/* Bottom Sheet Modal para pantallas pequeñas */}
      <BottomSheetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        depot={depot}
        stops={stops}
        isLoading={isLoading}
        returnToDepot={returnToDepot}
        status={status}
        result={result || undefined}
        onDepotChange={setDepot}
        onStopsChange={setStops}
        onReturnToDepotChange={setReturnToDepot}
        onOptimize={handleOptimize}
        onReorder={(newOrder: number[]) => {
          if (result) {
            const updatedResult = {
              ...result,
              order: newOrder
            };
            setResult(updatedResult);
            renderOnMap(updatedResult);
          }
        }}
        renderOnMap={renderOnMap}
        setResult={setResult}
      />
    </div>
  );
}
