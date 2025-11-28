'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { reservasService } from '@/lib/services';
import { ReservaConCancha } from '@padel/shared';
import { formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const router = useRouter();
  const [reservas, setReservas] = useState<ReservaConCancha[]>([]);
  const [loadingReservas, setLoadingReservas] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadReservas();
    }
  }, [isAuthenticated]);

  const loadReservas = async () => {
    try {
      const data = await reservasService.getMisReservas('proximas');
      setReservas(data);
    } catch (error) {
      console.error('Error loading reservas:', error);
    } finally {
      setLoadingReservas(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-dark-100 bg-dark-400">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">
            <span className="text-white">North </span>
            <span className="text-primary-500">Padel</span>
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">
              Hola, <span className="text-white">{user?.nombre}</span>
            </span>
            <button 
              onClick={handleLogout}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Mis Reservas</h2>
              <Link href="/reservar" className="btn-primary">
                + Nueva Reserva
              </Link>
            </div>

            {loadingReservas ? (
              <div className="card">
                <p className="text-gray-400 text-center py-8">Cargando reservas...</p>
              </div>
            ) : reservas.length === 0 ? (
              <div className="card text-center py-12">
                <div className="text-4xl mb-4">🎾</div>
                <h3 className="text-xl font-semibold mb-2">No tienes reservas</h3>
                <p className="text-gray-400 mb-6">
                  ¡Reserva tu primera cancha y comienza a jugar!
                </p>
                <Link href="/reservar" className="btn-primary inline-block">
                  Reservar Cancha
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {reservas.map((reserva) => (
                  <ReservaCard key={reserva.id} reserva={reserva} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Acciones Rápidas</h3>
              <div className="space-y-3">
                <Link 
                  href="/reservar" 
                  className="block w-full btn-primary text-center"
                >
                  Reservar Cancha
                </Link>
                <Link 
                  href="/canchas" 
                  className="block w-full btn-secondary text-center"
                >
                  Ver Canchas
                </Link>
                <Link 
                  href="/perfil" 
                  className="block w-full btn-secondary text-center"
                >
                  Mi Perfil
                </Link>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Mi Cuenta</h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-400">
                  Nombre: <span className="text-white">{user?.nombre} {user?.apellido}</span>
                </p>
                <p className="text-gray-400">
                  Email: <span className="text-white">{user?.email}</span>
                </p>
                {user?.telefono && (
                  <p className="text-gray-400">
                    Teléfono: <span className="text-white">{user.telefono}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function ReservaCard({ reserva }: { reserva: ReservaConCancha }) {
  const estadoColors: Record<string, string> = {
    Confirmada: 'bg-green-500/20 text-green-400 border-green-500/50',
    Pendiente: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    Cancelada: 'bg-red-500/20 text-red-400 border-red-500/50',
  };

  return (
    <div className="card flex items-center gap-4">
      {reserva.canchaImagenUrl && (
        <div className="w-20 h-20 rounded-lg bg-dark-200 overflow-hidden flex-shrink-0">
          <img 
            src={reserva.canchaImagenUrl} 
            alt={reserva.canchaNombre}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="flex-1">
        <h4 className="font-semibold">{reserva.canchaNombre}</h4>
        <p className="text-gray-400 text-sm">{formatDate(reserva.fecha)}</p>
        <p className="text-gray-400 text-sm">Hora: {reserva.hora}</p>
      </div>
      <div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${estadoColors[reserva.estado] || ''}`}>
          {reserva.estado}
        </span>
      </div>
    </div>
  );
}
