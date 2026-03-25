//almacen-oltech/src/components/almacen/Buscador.jsx
function Buscador({ placeholder, valor, onBuscar }) {
  return (
    <div className="relative w-full sm:w-96">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
      </div>
      <input
        type="text"
        value={valor}
        onChange={(e) => onBuscar(e.target.value)}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-oltech-pink outline-none transition-all shadow-sm text-sm"
        placeholder={placeholder || 'Buscar...'}
      />
    </div>
  );
}

export default Buscador;