export default function InfoPanel() {
  return (
    <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
      <p className="font-medium mb-1">ℹ️ Información:</p>
      <p>• Google limita matrices a ~25 puntos por batch</p>
      <p>• Para más puntos se usa cálculo aproximado</p>
      <p>• Los waypoints están limitados a 23 por tramo</p>
    </div>
  );
}
