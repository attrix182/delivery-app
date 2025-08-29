import { useEffect, useState } from 'react';

interface ResizableSidebarProps {
  isOpen: boolean;
  children: React.ReactNode;
}

export default function ResizableSidebar({ isOpen, children }: ResizableSidebarProps) {
  const [sidebarWidth, setSidebarWidth] = useState(448);
  const [isResizing, setIsResizing] = useState(false);

  // Event handlers para redimensionar el sidebar
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = e.clientX;
        if (newWidth >= 300 && newWidth <= 800) { // Límites min/max
          setSidebarWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.classList.remove('resizing');
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div 
      className={`${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static absolute inset-y-0 left-0 z-20 bg-white shadow-xl border-r border-gray-200 transition-transform duration-300 ease-in-out`}
      style={{ width: `${sidebarWidth}px` }}
    >
      <div className="h-full flex flex-col relative">
        {children}
        
        {/* Handle de redimensionamiento */}
        <div
          className="absolute top-0 right-0 w-2 h-full bg-gray-200 hover:bg-blue-400 transition-colors flex items-center justify-center"
          onMouseDown={() => {
            setIsResizing(true);
            document.body.classList.add('resizing');
          }}
          style={{ cursor: 'col-resize' }}
        >
          <div className="w-0.5 h-8 bg-gray-400 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
