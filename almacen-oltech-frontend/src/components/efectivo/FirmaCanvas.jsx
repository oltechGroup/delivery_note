// almacen-oltech-frontend/src/components/efectivo/FirmaCanvas.jsx
import { useRef, useState, useEffect } from 'react';

function FirmaCanvas({ onFirmaLista }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Fondo blanco
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Estilo del trazo
    context.lineWidth = 3;
    context.lineCap = 'round';
    context.strokeStyle = '#000000'; 
  }, []);

  const getCoordinates = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // SOLUCIÓN: Calculamos la escala o proporción entre el tamaño interno (400x200) 
    // y el tamaño visual real que tiene el canvas en la pantalla del dispositivo.
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Para pantallas táctiles (Móviles/Tablets)
    if (event.touches && event.touches.length > 0) {
      return {
        offsetX: (event.touches[0].clientX - rect.left) * scaleX,
        offsetY: (event.touches[0].clientY - rect.top) * scaleY
      };
    }
    
    // Para el ratón en PC, unificamos usando la misma fórmula matemática
    // para garantizar que siempre pinte justo donde está el puntero.
    return { 
      offsetX: (event.clientX - rect.left) * scaleX, 
      offsetY: (event.clientY - rect.top) * scaleY 
    };
  };

  const startDrawing = (e) => {
    const { offsetX, offsetY } = getCoordinates(e);
    const context = canvasRef.current.getContext('2d');
    context.beginPath();
    context.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const { offsetX, offsetY } = getCoordinates(e);
    const context = canvasRef.current.getContext('2d');
    context.lineTo(offsetX, offsetY);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    
    // CORRECCIÓN 1: Definimos el contexto antes de cerrarlo
    const context = canvasRef.current.getContext('2d');
    context.closePath();
    setIsDrawing(false);
    
    // Convertir y enviar al padre
    const imagenDataUrl = canvasRef.current.toDataURL('image/png');
    onFirmaLista(imagenDataUrl);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Limpiamos con blanco nuevamente
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // CORRECCIÓN 2: Reseteamos el path para evitar que dibuje líneas extrañas después de limpiar
    context.beginPath(); 
    
    onFirmaLista(null);
  };

  return (
    <div className="flex flex-col items-center">
      {/* CORRECCIÓN 3: Usamos touch-action: none para prevenir el scroll sin advertencias de React */}
      <div 
        className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white shadow-inner"
        style={{ touchAction: 'none' }} 
      >
        <canvas
          ref={canvasRef}
          width={400}
          height={200}
          className="cursor-crosshair w-full max-w-full block"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          onTouchCancel={stopDrawing}
        />
      </div>
      <div className="mt-2 flex justify-end w-full max-w-[400px]">
        <button 
          type="button"
          onClick={clearCanvas} 
          className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1"
        >
          ✖ Borrar firma y repetir
        </button>
      </div>
    </div>
  );
}

export default FirmaCanvas;