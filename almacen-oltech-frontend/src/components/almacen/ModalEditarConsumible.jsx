// almacen-oltech-frontend/src/components/almacen/ModalEditarConsumible.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

function ModalEditarConsumible({ isOpen, onClose, onGuardado, consumible }) {
    const { token } = useAuth();
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');
    
    const sugerenciasUnidad = ['PIEZA', 'HOLE', 'MM', 'Ф', 'PAR', 'CAJA'];

    // Estado del formulario
    const [formData, setFormData] = useState({
        codigo_referencia: '',
        nombre: '',
        nombre_comercial: '',
        precio: '',
        unidad_medida: '',
        lote: '',
        fecha_caducidad: '',
        categoria_id: ''
    });

    // Cargar datos del consumible cuando se abre el modal o cambia el consumible
    useEffect(() => {
        if (isOpen && consumible) {
            setFormData({
                codigo_referencia: consumible.codigo_referencia || '',
                nombre: consumible.nombre || '',
                nombre_comercial: consumible.nombre_comercial || '',
                precio: consumible.precio || '',
                unidad_medida: consumible.unidad_medida || '',
                lote: consumible.lote || '',
                fecha_caducidad: consumible.fecha_caducidad || '',
                categoria_id: consumible.categoria_id || ''
            });
            setError('');
        }
    }, [isOpen, consumible]);

    if (!isOpen || !consumible) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.codigo_referencia.trim() || !formData.nombre.trim()) {
            setError('Código y Nombre son obligatorios.');
            return;
        }

        setCargando(true);
        setError('');

        try {
            await axios.put(`http://localhost:4000/api/almacen/consumibles/${consumible.id}`, {
                ...formData,
                codigo_referencia: formData.codigo_referencia.toUpperCase(),
                nombre: formData.nombre.toUpperCase(),
                nombre_comercial: formData.nombre_comercial ? formData.nombre_comercial.toUpperCase() : null,
                lote: formData.lote ? formData.lote.toUpperCase() : null,
                fecha_caducidad: formData.fecha_caducidad ? formData.fecha_caducidad.toUpperCase() : null,
                precio: formData.precio ? parseFloat(formData.precio) : null
            }, { headers: { Authorization: `Bearer ${token}` } });

            onGuardado();
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.mensaje || 'Error al actualizar el insumo.');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
            {/* RESPONSIVO: max-h-[90vh] y flex-col para proteger contra el teclado virtual en móviles */}
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200 border border-blue-100">
                
                {/* Encabezado */}
                {/* RESPONSIVO: shrink-0 para proteger el header del scroll, padding ajustado */}
                <div className="bg-oltech-blue px-4 sm:px-6 py-4 sm:py-5 flex justify-between items-center text-white shrink-0">
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold flex items-center space-x-2">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                            <span>Editar Insumo</span>
                        </h2>
                        <p className="text-blue-100 text-xs font-medium mt-1">ID: #{consumible.id}</p>
                    </div>
                    <button onClick={onClose} className="hover:rotate-90 transition-transform duration-200 p-1 bg-white/10 rounded-full shrink-0 ml-2">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                {/* Formulario */}
                {/* RESPONSIVO: overflow-y-auto para permitir scroll interno */}
                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 bg-white overflow-y-auto">
                    
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 rounded-md animate-in slide-in-from-top-1">
                            <p className="text-xs sm:text-sm text-red-700 font-bold">{error}</p>
                        </div>
                    )}

                    {/* Ficha Técnica Principal */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        <div className="md:col-span-1">
                            <label className="block text-[10px] sm:text-xs font-black text-gray-500 uppercase mb-1">Código de Referencia</label>
                            {/* RESPONSIVO: text-base sm:text-sm en inputs para evitar auto-zoom */}
                            <input 
                                type="text" name="codigo_referencia" required
                                value={formData.codigo_referencia} onChange={handleChange}
                                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-oltech-blue outline-none uppercase font-mono text-base sm:text-sm bg-gray-50"
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-[10px] sm:text-xs font-black text-gray-500 uppercase mb-1">Precio Unitario</label>
                            <div className="relative">
                                <span className="absolute left-3 sm:left-4 top-2 sm:top-2.5 text-gray-400 font-bold">$</span>
                                <input 
                                    type="number" name="precio" step="0.01"
                                    value={formData.precio} onChange={handleChange}
                                    className="w-full pl-7 sm:pl-8 pr-3 sm:pr-4 py-2 sm:py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-oltech-blue outline-none font-bold text-gray-700 bg-gray-50 text-base sm:text-sm"
                                />
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-[10px] sm:text-xs font-black text-gray-500 uppercase mb-1">Nombre / Descripción</label>
                            <input 
                                type="text" name="nombre" required
                                value={formData.nombre} onChange={handleChange}
                                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-oltech-blue outline-none uppercase font-semibold bg-gray-50 text-base sm:text-sm"
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-[10px] sm:text-xs font-black text-gray-500 uppercase mb-1">Nombre Comercial</label>
                            <input 
                                type="text" name="nombre_comercial"
                                value={formData.nombre_comercial} onChange={handleChange}
                                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-oltech-blue outline-none uppercase italic bg-gray-50 text-base sm:text-sm"
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-[10px] sm:text-xs font-black text-gray-500 uppercase mb-1">Unidad de Medida</label>
                            <input 
                                type="text" name="unidad_medida" list="unidades-edit"
                                value={formData.unidad_medida} onChange={handleChange}
                                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-oltech-blue outline-none uppercase bg-gray-50 text-base sm:text-sm"
                            />
                            <datalist id="unidades-edit">
                                {sugerenciasUnidad.map(u => <option key={u} value={u} />)}
                            </datalist>
                        </div>
                    </div>

                    {/* SECCIÓN CRÍTICA: Lote y Caducidad */}
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 sm:p-4 space-y-3">
                        <div className="flex items-center space-x-2 text-amber-700 mb-1">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                            </svg>
                            <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-wider">Control de Trazabilidad</h3>
                        </div>
                        
                        {/* RESPONSIVO: grid-cols-1 en móvil para que Lote y Caducidad no queden tan apretados, grid-cols-2 en PC */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-amber-800 uppercase mb-1">Lote del Insumo</label>
                                <input 
                                    type="text" name="lote"
                                    value={formData.lote} onChange={handleChange}
                                    className="w-full px-3 sm:px-4 py-2 rounded-lg border border-amber-300 focus:ring-2 focus:ring-amber-500 outline-none uppercase font-mono bg-white text-base sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-amber-800 uppercase mb-1">Fecha de Caducidad</label>
                                <input 
                                    type="text" name="fecha_caducidad"
                                    value={formData.fecha_caducidad} onChange={handleChange}
                                    className="w-full px-3 sm:px-4 py-2 rounded-lg border border-amber-300 focus:ring-2 focus:ring-amber-500 outline-none uppercase bg-white font-bold text-base sm:text-sm"
                                    placeholder="EJ: OCT 2026"
                                />
                            </div>
                        </div>
                        <p className="text-[9px] text-amber-600 font-medium leading-tight">
                            * Nota: Estás editando los datos de este lote específico. Si necesitas cambiar el stock, utiliza los botones de ajuste (+/-) en la tabla principal.
                        </p>
                    </div>

                    {/* Botones de Acción */}
                    {/* RESPONSIVO: flex-col-reverse en móvil para apilar y w-full */}
                    <div className="pt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4 sm:space-x-0 border-t border-gray-100 mt-auto">
                        <button 
                            type="button" onClick={onClose} 
                            className="w-full sm:w-auto px-6 py-2.5 sm:py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors flex justify-center items-center"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" disabled={cargando}
                            className="w-full sm:w-auto px-8 py-2.5 sm:py-2.5 bg-oltech-blue text-white rounded-xl text-sm font-black shadow-lg hover:bg-blue-800 transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center space-x-2"
                        >
                            {cargando ? (
                                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : null}
                            <span>{cargando ? 'Guardando...' : 'Actualizar Registro'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ModalEditarConsumible;