'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { canchasService, reservasService } from '@/lib/services';
import { CanchaDetalle } from '@padel/shared';
import { formatPrice, formatDate } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

export default function CanchaDetallePage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const complejoId = params.complejoId as string;
  const canchaId = params.canchaId as string;

  const [cancha, setCancha] = useState<CanchaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedHora, setSelectedHora] = useState<string | null>(null);
  const [reservando, setReservando] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (complejoId && canchaId) {
      loadCanchaDetalle();
    }
  }, [complejoId, canchaId, selectedDate]);

  const loadCanchaDetalle = async () => {
    setLoading(true);
    try {
      const data = await canchasService.getCanchaDetalle(complejoId, canchaId, selectedDate);
      setCancha(data);
    } catch (error) {
      console.error('Error loading cancha:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReservar = async () => {
    if (!selectedHora || !user) return;
    
    setReservando(true);
    setError('');

    try {
      const result = await reservasService.crearReserva({
        complejoId,
        canchaId,
        fecha: selectedDate,
        hora: selectedHora,
        usuarioId: user.uid,
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setError(result.message || 'Error al crear la reserva');
      }
    } catch (err: any) {
      setError(err.message || 'Error al crear la reserva');
    } finally {
      setReservando(false);
    }
  };

  // Generar próximos 7 días
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), i);
    return {
      value: format(date, 'yyyy-MM-dd'),
      label: format(date, 'EEE d', { locale: es }),
      isToday: i === 0,
    };
  });

  if (authLoading || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </main>
    );
  }

  if (!cancha) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">No se encontró la cancha</p>
          <Link href="/reservar" className="btn-primary">
            Volver a canchas
          </Link>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="card text-center max-w-md">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2">¡Reserva Confirmada!</h2>
          <p className="text-gray-400 mb-4">
            Tu reserva ha sido creada exitosamente.
          </p>
          <p className="text-primary-500">
            Redirigiendo al dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-dark-100 bg-dark-400">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/reservar" className="text-gray-400 hover:text-white">
            ← Volver a canchas
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Imagen y detalles */}
        <div className="card mb-8">
          {(cancha.imagenUrl || cancha.imagenes?.[0]) && (
            <div className="h-64 -mx-6 -mt-6 mb-6 bg-dark-200 overflow-hidden rounded-t-xl">
              <img 
                src={cancha.imagenUrl || cancha.imagenes?.[0]} 
                alt={cancha.nombre}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <h1 className="text-2xl font-bold">{cancha.nombre}</h1>
          <p className="text-gray-400">{cancha.complejoNombre}</p>
          <p className="text-2xl font-bold text-primary-500 mt-2">
            {formatPrice(cancha.precioHora)} / hora
          </p>
          
          {cancha.descripcion && (
            <p className="text-gray-400 mt-4">{cancha.descripcion}</p>
          )}

          {cancha.caracteristicas && cancha.caracteristicas.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {cancha.caracteristicas.map((car, i) => (
                <span key={i} className="px-3 py-1 bg-dark-200 rounded-full text-sm text-gray-300">
                  {car}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Selector de fecha */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">Selecciona una fecha</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {dates.map((date) => (
              <button
                key={date.value}
                onClick={() => {
                  setSelectedDate(date.value);
                  setSelectedHora(null);
                }}
                className={`px-4 py-3 rounded-lg text-center min-w-[80px] transition-colors ${
                  selectedDate === date.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-200 text-gray-400 hover:bg-dark-100'
                }`}
              >
                <div className="text-sm capitalize">{date.label}</div>
                {date.isToday && <div className="text-xs opacity-70">Hoy</div>}
              </button>
            ))}
          </div>
        </div>

        {/* Selector de horarios */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">Selecciona un horario</h3>
          
          {cancha.horariosDisponibles && cancha.horariosDisponibles.length > 0 ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {cancha.horariosDisponibles.map((hora) => {
                const isOcupado = cancha.horariosOcupados?.includes(hora) || 
                                  cancha.horariosReservados?.includes(hora) ||
                                  cancha.horariosBloqueados?.includes(hora);
                
                return (
                  <button
                    key={hora}
                    onClick={() => !isOcupado && setSelectedHora(hora)}
                    disabled={isOcupado}
                    className={`py-3 rounded-lg text-center transition-colors ${
                      isOcupado
                        ? 'bg-dark-400 text-gray-600 cursor-not-allowed'
                        : selectedHora === hora
                        ? 'bg-primary-500 text-white'
                        : 'bg-dark-200 text-gray-300 hover:bg-dark-100'
                    }`}
                  >
                    {hora}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">
              No hay horarios disponibles para esta fecha
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Botón de reserva */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400">Fecha seleccionada</p>
              <p className="text-lg font-semibold">{formatDate(selectedDate)}</p>
              {selectedHora && (
                <p className="text-primary-500">Hora: {selectedHora}</p>
              )}
            </div>
            <button
              onClick={handleReservar}
              disabled={!selectedHora || reservando}
              className="btn-primary py-3 px-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {reservando ? 'Reservando...' : 'Confirmar Reserva'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
