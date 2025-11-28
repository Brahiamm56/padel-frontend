'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { canchasService } from '@/lib/services';
import { Complejo, Cancha } from '@padel/shared';
import { formatPrice } from '@/lib/utils';

export default function ReservarPage() {
  const { isAuthenticated, loading } = useAuth();
  const [complejos, setComplejos] = useState<Complejo[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedComplejo, setSelectedComplejo] = useState<string | null>(null);

  useEffect(() => {
    loadComplejos();
  }, []);

  const loadComplejos = async () => {
    try {
      const data = await canchasService.getComplejosConCanchas();
      setComplejos(data);
      if (data.length > 0) {
        setSelectedComplejo(data[0].id);
      }
    } catch (error) {
      console.error('Error loading complejos:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const currentComplejo = complejos.find(c => c.id === selectedComplejo);

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-dark-100 bg-dark-400">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={isAuthenticated ? '/dashboard' : '/'} className="text-gray-400 hover:text-white">
              ← Volver
            </Link>
            <h1 className="text-xl font-bold">
              <span className="text-white">Reservar </span>
              <span className="text-primary-500">Cancha</span>
            </h1>
          </div>
          {!isAuthenticated && !loading && (
            <Link href="/auth/login" className="btn-primary text-sm">
              Iniciar Sesión
            </Link>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loadingData ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Cargando canchas...</p>
          </div>
        ) : complejos.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-4xl mb-4">🏟️</div>
            <h3 className="text-xl font-semibold mb-2">No hay canchas disponibles</h3>
            <p className="text-gray-400">
              Por el momento no hay canchas registradas en el sistema.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Selector de Complejo */}
            {complejos.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {complejos.map((complejo) => (
                  <button
                    key={complejo.id}
                    onClick={() => setSelectedComplejo(complejo.id)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      selectedComplejo === complejo.id
                        ? 'bg-primary-500 text-white'
                        : 'bg-dark-300 text-gray-400 hover:bg-dark-200'
                    }`}
                  >
                    {complejo.nombre}
                  </button>
                ))}
              </div>
            )}

            {/* Información del Complejo */}
            {currentComplejo && (
              <div className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{currentComplejo.nombre}</h2>
                    {currentComplejo.direccion && (
                      <p className="text-gray-400 mt-1">{currentComplejo.direccion}</p>
                    )}
                    {currentComplejo.telefono && (
                      <p className="text-gray-400">{currentComplejo.telefono}</p>
                    )}
                  </div>
                  {currentComplejo.rating && (
                    <div className="flex items-center gap-1 text-yellow-400">
                      <span>⭐</span>
                      <span>{currentComplejo.rating}</span>
                      {currentComplejo.reviewsCount && (
                        <span className="text-gray-400 text-sm">
                          ({currentComplejo.reviewsCount})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Lista de Canchas */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Canchas Disponibles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentComplejo?.canchas.map((cancha) => (
                  <CanchaCard 
                    key={cancha.id} 
                    cancha={cancha} 
                    complejoId={currentComplejo.id}
                    isAuthenticated={isAuthenticated}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function CanchaCard({ 
  cancha, 
  complejoId,
  isAuthenticated 
}: { 
  cancha: Cancha; 
  complejoId: string;
  isAuthenticated: boolean;
}) {
  return (
    <div className="card overflow-hidden">
      {cancha.imagenUrl && (
        <div className="h-48 -mx-6 -mt-6 mb-4 bg-dark-200 overflow-hidden">
          <img 
            src={cancha.imagenUrl} 
            alt={cancha.nombre}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <h4 className="font-semibold text-lg">{cancha.nombre}</h4>
      <p className="text-primary-500 font-bold mt-1">
        {formatPrice(cancha.precioHora)} / hora
      </p>
      
      {/* Características */}
      <div className="flex flex-wrap gap-2 mt-3">
        {cancha.techada && (
          <span className="px-2 py-1 bg-dark-200 rounded text-xs text-gray-300">
            Techada
          </span>
        )}
        {cancha.iluminacion && (
          <span className="px-2 py-1 bg-dark-200 rounded text-xs text-gray-300">
            Iluminación
          </span>
        )}
        {cancha.blindex && (
          <span className="px-2 py-1 bg-dark-200 rounded text-xs text-gray-300">
            Blindex
          </span>
        )}
        {cancha.cesped && (
          <span className="px-2 py-1 bg-dark-200 rounded text-xs text-gray-300">
            Césped
          </span>
        )}
      </div>

      {cancha.horariosDisponibles !== undefined && (
        <p className="text-gray-400 text-sm mt-3">
          {cancha.horariosDisponibles} horarios disponibles hoy
        </p>
      )}

      <Link 
        href={isAuthenticated ? `/reservar/${complejoId}/${cancha.id}` : '/auth/login'}
        className="btn-primary w-full mt-4 text-center block"
      >
        {isAuthenticated ? 'Ver Horarios' : 'Iniciar sesión para reservar'}
      </Link>
    </div>
  );
}
